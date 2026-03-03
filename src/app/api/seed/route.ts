import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMondayOf, formatWeekParam } from "@/applications/planning/lib/weekUtils";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const recipes = [
    {
      name: "Pâtes carbonara",
      description: "La vraie recette romaine, sans crème fraîche.",
      servings: 2,
      prep_time_minutes: 10,
      cook_time_minutes: 15,
      ingredients: [
        { custom_name: "Spaghetti", quantity: 200, unit: "g" },
        { custom_name: "Guanciale (ou lardons)", quantity: 100, unit: "g" },
        { custom_name: "Jaunes d'œuf", quantity: 3, unit: "pièce" },
        { custom_name: "Pecorino Romano râpé", quantity: 50, unit: "g" },
        { custom_name: "Poivre noir", quantity: 1, unit: "pincée" },
      ],
      steps: [
        "Faire cuire les pâtes dans de l'eau bouillante salée jusqu'à al dente.",
        "Faire revenir le guanciale à feu moyen jusqu'à ce qu'il soit croustillant.",
        "Mélanger les jaunes d'œuf avec le pecorino et du poivre.",
        "Hors du feu, mélanger les pâtes égouttées avec le guanciale, puis ajouter le mélange œuf-fromage. Remuer rapidement en ajoutant un peu d'eau de cuisson.",
      ],
    },
    {
      name: "Poulet rôti au citron",
      description: "Un classique du dimanche, parfumé au citron et aux herbes.",
      servings: 4,
      prep_time_minutes: 15,
      cook_time_minutes: 60,
      ingredients: [
        { custom_name: "Poulet entier", quantity: 1.5, unit: "kg" },
        { custom_name: "Citron", quantity: 2, unit: "pièce" },
        { custom_name: "Ail", quantity: 4, unit: "gousse" },
        { custom_name: "Thym", quantity: 3, unit: "branche" },
        { custom_name: "Huile d'olive", quantity: 3, unit: "c. à soupe" },
        { custom_name: "Sel, poivre", quantity: 1, unit: "pincée" },
      ],
      steps: [
        "Préchauffer le four à 200 °C.",
        "Frotter le poulet avec l'huile d'olive, le sel et le poivre. Farcir l'intérieur avec le citron coupé en deux, l'ail et le thym.",
        "Enfourner 1h en arrosant toutes les 20 minutes.",
        "Laisser reposer 10 minutes avant de découper.",
      ],
    },
    {
      name: "Salade niçoise",
      description: "Fraîche et complète, parfaite pour un déjeuner d'été.",
      servings: 2,
      prep_time_minutes: 20,
      cook_time_minutes: 10,
      ingredients: [
        { custom_name: "Thon en boîte", quantity: 200, unit: "g" },
        { custom_name: "Haricots verts", quantity: 150, unit: "g" },
        { custom_name: "Œufs durs", quantity: 2, unit: "pièce" },
        { custom_name: "Tomates cerises", quantity: 12, unit: "pièce" },
        { custom_name: "Olives noires", quantity: 50, unit: "g" },
        { custom_name: "Anchois", quantity: 4, unit: "filet" },
        { custom_name: "Vinaigrette à la moutarde", quantity: 3, unit: "c. à soupe" },
      ],
      steps: [
        "Cuire les haricots verts 5 min à l'eau bouillante, puis les rafraîchir.",
        "Cuire les œufs 10 min, les écaler et les couper en quartiers.",
        "Dresser tous les ingrédients dans un grand saladier et assaisonner.",
      ],
    },
    {
      name: "Soupe à l'oignon",
      description: "La soupe réconfortante par excellence, gratinée au four.",
      servings: 4,
      prep_time_minutes: 15,
      cook_time_minutes: 50,
      ingredients: [
        { custom_name: "Oignons", quantity: 1, unit: "kg" },
        { custom_name: "Beurre", quantity: 40, unit: "g" },
        { custom_name: "Vin blanc sec", quantity: 150, unit: "ml" },
        { custom_name: "Bouillon de bœuf", quantity: 1, unit: "L" },
        { custom_name: "Pain de campagne", quantity: 4, unit: "tranche" },
        { custom_name: "Gruyère râpé", quantity: 100, unit: "g" },
      ],
      steps: [
        "Faire fondre le beurre et caraméliser les oignons émincés à feu doux pendant 30 min.",
        "Déglacer au vin blanc et laisser réduire 5 min.",
        "Ajouter le bouillon et laisser mijoter 15 min.",
        "Verser dans des bols allant au four, poser le pain, couvrir de gruyère et gratiner 10 min.",
      ],
    },
    {
      name: "Omelette aux champignons",
      description: "Rapide, nourrissante et délicieuse.",
      servings: 2,
      prep_time_minutes: 5,
      cook_time_minutes: 10,
      ingredients: [
        { custom_name: "Œufs", quantity: 4, unit: "pièce" },
        { custom_name: "Champignons de Paris", quantity: 200, unit: "g" },
        { custom_name: "Beurre", quantity: 20, unit: "g" },
        { custom_name: "Persil frais", quantity: 2, unit: "c. à soupe" },
        { custom_name: "Sel, poivre", quantity: 1, unit: "pincée" },
      ],
      steps: [
        "Faire sauter les champignons émincés dans le beurre 5 min.",
        "Battre les œufs avec le sel et le poivre.",
        "Verser les œufs dans la poêle sur les champignons et cuire à feu moyen en repliant les bords.",
        "Parsemer de persil et servir aussitôt.",
      ],
    },
    {
      name: "Buddha bowl au quinoa",
      description: "Coloré, équilibré, bourré de nutriments.",
      servings: 2,
      prep_time_minutes: 15,
      cook_time_minutes: 15,
      ingredients: [
        { custom_name: "Quinoa", quantity: 160, unit: "g" },
        { custom_name: "Pois chiches", quantity: 200, unit: "g" },
        { custom_name: "Avocat", quantity: 1, unit: "pièce" },
        { custom_name: "Concombre", quantity: 1, unit: "demi" },
        { custom_name: "Carottes râpées", quantity: 100, unit: "g" },
        { custom_name: "Sauce tahini-citron", quantity: 3, unit: "c. à soupe" },
      ],
      steps: [
        "Cuire le quinoa selon les instructions du paquet.",
        "Rôtir les pois chiches au four 20 min à 200 °C avec huile et épices.",
        "Assembler tous les ingrédients dans un bol et napper de sauce tahini.",
      ],
    },
  ];

  const createdRecipes: { id: string; name: string }[] = [];

  for (const recipe of recipes) {
    const { ingredients, steps, ...recipeData } = recipe;

    const { data: created, error } = await supabase
      .from("recipes")
      .insert({ ...recipeData, user_id: user.id })
      .select("id, name")
      .single();

    if (error || !created) continue;
    createdRecipes.push(created);

    if (ingredients.length) {
      await supabase.from("recipe_ingredients").insert(
        ingredients.map((ing, i) => ({ ...ing, recipe_id: created.id, sort_order: i }))
      );
    }
    if (steps.length) {
      await supabase.from("recipe_steps").insert(
        steps.map((description, i) => ({ recipe_id: created.id, step_number: i + 1, description }))
      );
    }
  }

  const monday = getMondayOf(new Date());
  const weekParam = formatWeekParam(monday);

  const { data: plan } = await supabase
    .from("meal_plans")
    .upsert({ user_id: user.id, week_start: weekParam }, { onConflict: "user_id,week_start" })
    .select("id")
    .single();

  if (plan && createdRecipes.length >= 6) {
    const slots = [
      { day_of_week: 1, meal_type: "lunch",   recipe: createdRecipes[0] },
      { day_of_week: 1, meal_type: "dinner",  recipe: createdRecipes[1] },
      { day_of_week: 2, meal_type: "breakfast", recipe: createdRecipes[4] },
      { day_of_week: 2, meal_type: "lunch",   recipe: createdRecipes[2] },
      { day_of_week: 3, meal_type: "dinner",  recipe: createdRecipes[3] },
      { day_of_week: 4, meal_type: "lunch",   recipe: createdRecipes[5] },
      { day_of_week: 4, meal_type: "dinner",  recipe: createdRecipes[0] },
      { day_of_week: 5, meal_type: "lunch",   recipe: createdRecipes[1] },
      { day_of_week: 6, meal_type: "lunch",   recipe: createdRecipes[2] },
      { day_of_week: 7, meal_type: "dinner",  recipe: createdRecipes[3] },
    ];

    await supabase.from("meal_slots").insert(
      slots.map((s) => ({
        meal_plan_id: plan.id,
        day_of_week: s.day_of_week,
        meal_type: s.meal_type,
        recipe_id: s.recipe.id,
        servings: 4,
      }))
    );
  }

  return NextResponse.json({
    ok: true,
    recipes: createdRecipes.map((r) => r.name),
    message: `${createdRecipes.length} recettes créées + planning de la semaine seeded`,
  });
}
