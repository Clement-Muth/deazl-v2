import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecipeIngredient {
  custom_name: string;
  quantity: number;
  unit: string;
  section: string | null;
}

interface RecipeStep {
  step_number: number;
  description: string;
}

interface RecipeRow {
  id: string;
  name: string;
  servings: number;
  fridge_days: number | null;
  freezer_months: number | null;
  recipe_ingredients: RecipeIngredient[];
  recipe_steps: RecipeStep[];
}

async function generateWithGroq(recipes: RecipeRow[]): Promise<object> {
  const client = new OpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const recipesText = recipes.map((r) => {
    const ingredients = (r.recipe_ingredients ?? [])
      .map((i) => `${i.quantity} ${i.unit} ${i.custom_name}`)
      .join(", ");
    const steps = (r.recipe_steps ?? [])
      .sort((a, b) => a.step_number - b.step_number)
      .map((s) => `${s.step_number}. ${s.description}`)
      .join(" | ");
    const conservation = [
      r.fridge_days ? `${r.fridge_days}j réfrigérateur` : null,
      r.freezer_months ? `${r.freezer_months} mois congélateur` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return `**${r.name}** (${r.servings} portions, conservation: ${conservation || "non précisée"})
Ingrédients: ${ingredients}
Étapes: ${steps}`;
  }).join("\n\n");

  const prompt = `Tu es un chef cuisinier expert en batch cooking. Tu dois créer un plan de cuisson optimisé pour préparer ${recipes.length} recette(s) en une seule session.

Recettes à préparer :
${recipesText}

Ta mission :
1. Lister tous les ustensiles nécessaires (sois complet : casseroles, poêles, plats à four, planches, couteaux...)
2. Lister la mise en place complète (tout ce qu'on prépare avant d'allumer le feu : éplucher, couper, peser, etc.)
3. Créer des étapes de cuisson fusionnées et optimisées : parallélise intelligemment les tâches (ex: "Pendant que la quiche cuit au four (45min), préparer le curry"). Pour chaque étape, liste uniquement les ingrédients spécifiquement utilisés à cette étape (3-5 max, avec quantité exacte)
4. Donner les conseils de conservation pour chaque plat

Réponds UNIQUEMENT avec du JSON valide, sans texte autour, dans ce format exact :
{
  "total_minutes": 90,
  "ustensiles": ["Cocotte 5L", "Poêle antiadhésive 28cm", "Plat à gratin", "Couteau de chef", "Planche à découper"],
  "mise_en_place": [
    {"ingredient": "Oignons", "quantity": "3 unités", "preparation": "éplucher et couper en dés", "recipe_name": "Nom de la recette"}
  ],
  "steps": [
    {
      "index": 1,
      "title": "Titre court de l'étape",
      "description": "Description détaillée et guidante pour un cuisinier amateur",
      "duration_minutes": 10,
      "temperature": null,
      "recipes_involved": ["Nom recette 1"],
      "is_parallel": false,
      "ingredients": [
        {"name": "Carotte", "quantity": "3 unités"},
        {"name": "Oignon", "quantity": "1 pièce"}
      ]
    }
  ],
  "conservation": [
    {"recipe_name": "Nom de la recette", "container": "Boîte hermétique", "fridge_days": 3, "freezer_months": 2}
  ]
}`;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (completion.choices[0].message.content ?? "").trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in Groq response");

  return JSON.parse(jsonMatch[0]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace("Bearer ", "");

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: { user }, error: authError } = await adminClient.auth.getUser(jwt ?? "");
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });

    const { recipe_ids, week_start } = await req.json() as { recipe_ids: string[]; week_start: string };

    if (!recipe_ids?.length || !week_start) {
      return new Response(JSON.stringify({ error: "Missing recipe_ids or week_start" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: recipes, error: recipesError } = await adminClient
      .from("recipes")
      .select("id, name, servings, fridge_days, freezer_months, recipe_ingredients(custom_name, quantity, unit, section), recipe_steps(step_number, description)")
      .in("id", recipe_ids);

    if (recipesError || !recipes?.length) {
      return new Response(JSON.stringify({ error: "Failed to fetch recipes" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: membership } = await userClient
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const householdId = membership?.household_id ?? null;
    const sessionData = await generateWithGroq(recipes as RecipeRow[]);
    const updatedAt = new Date().toISOString();

    let existingId: string | null = null;
    if (householdId) {
      const { data } = await userClient
        .from("batch_cooking_sessions")
        .select("id")
        .eq("household_id", householdId)
        .eq("week_start", week_start)
        .maybeSingle();
      existingId = data?.id ?? null;
    } else {
      const { data } = await userClient
        .from("batch_cooking_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_start", week_start)
        .maybeSingle();
      existingId = data?.id ?? null;
    }

    let saveError;
    if (existingId) {
      const { error } = await userClient
        .from("batch_cooking_sessions")
        .update({ user_id: user.id, recipe_ids, session_data: sessionData, updated_at: updatedAt })
        .eq("id", existingId);
      saveError = error;
    } else {
      const { error } = await userClient
        .from("batch_cooking_sessions")
        .insert({ user_id: user.id, household_id: householdId, week_start, recipe_ids, session_data: sessionData, updated_at: updatedAt });
      saveError = error;
    }

    if (saveError) {
      return new Response(JSON.stringify({ error: saveError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ session_data: sessionData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
