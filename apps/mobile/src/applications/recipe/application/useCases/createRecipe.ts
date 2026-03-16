import { supabase } from "../../../../lib/supabase";
import { autoLinkIngredients } from "./autoLinkIngredients";

export interface RecipeIngredientInput {
  name: string;
  quantity: number;
  unit: string;
  section?: string | null;
}

export interface RecipeStepInput {
  description: string;
  section?: string | null;
}

export interface RecipeInput {
  name: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  dietaryTags: string[];
  imageUrl: string | null;
  isPublic?: boolean;
  ingredients: RecipeIngredientInput[];
  steps: RecipeStepInput[];
}

export async function createRecipe(input: RecipeInput): Promise<string | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      servings: input.servings,
      prep_time_minutes: input.prepTimeMinutes,
      cook_time_minutes: input.cookTimeMinutes,
      dietary_tags: input.dietaryTags,
      image_url: input.imageUrl,
      is_public: input.isPublic ?? false,
    })
    .select("id")
    .single();

  if (recipeError || !recipe) return { error: recipeError?.message ?? "Failed to create recipe" };

  const ingredients = input.ingredients
    .filter((ing) => ing.name.trim().length > 0)
    .map((ing, i) => ({
      recipe_id: recipe.id,
      custom_name: ing.name.trim(),
      quantity: ing.quantity,
      unit: ing.unit || "pièce",
      sort_order: i,
      section: ing.section ?? null,
    }));

  if (ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(ingredients);
  }

  const steps = input.steps
    .filter((s) => s.description.trim().length > 0)
    .map((s, i) => ({ recipe_id: recipe.id, step_number: i + 1, description: s.description.trim(), section: s.section ?? null }));

  if (steps.length > 0) {
    await supabase.from("recipe_steps").insert(steps);
  }

  await autoLinkIngredients(recipe.id);

  return recipe.id;
}
