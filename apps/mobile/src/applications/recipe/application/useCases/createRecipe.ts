import { supabase } from "../../../../lib/supabase";

export interface RecipeIngredientInput {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeInput {
  name: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  dietaryTags: string[];
  ingredients: RecipeIngredientInput[];
  steps: string[];
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
      is_public: false,
      is_favorite: false,
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
    }));

  if (ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(ingredients);
  }

  const steps = input.steps
    .filter((s) => s.trim().length > 0)
    .map((desc, i) => ({ recipe_id: recipe.id, step_number: i + 1, description: desc.trim() }));

  if (steps.length > 0) {
    await supabase.from("recipe_steps").insert(steps);
  }

  return recipe.id;
}
