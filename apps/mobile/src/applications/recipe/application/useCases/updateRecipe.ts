import { supabase } from "../../../../lib/supabase";
import type { RecipeInput } from "./createRecipe";
import { autoLinkIngredients } from "./autoLinkIngredients";

export async function updateRecipe(id: string, input: RecipeInput): Promise<{ error: string } | null> {
  const { error: recipeError } = await supabase
    .from("recipes")
    .update({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      servings: input.servings,
      prep_time_minutes: input.prepTimeMinutes,
      cook_time_minutes: input.cookTimeMinutes,
      dietary_tags: input.dietaryTags,
      image_url: input.imageUrl,
      is_public: input.isPublic ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (recipeError) return { error: recipeError.message };

  await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
  await supabase.from("recipe_steps").delete().eq("recipe_id", id);

  const ingredients = input.ingredients
    .filter((ing) => ing.name.trim().length > 0)
    .map((ing, i) => ({
      recipe_id: id,
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
    .map((desc, i) => ({ recipe_id: id, step_number: i + 1, description: desc.trim() }));

  if (steps.length > 0) {
    await supabase.from("recipe_steps").insert(steps);
  }

  await autoLinkIngredients(id);

  return null;
}
