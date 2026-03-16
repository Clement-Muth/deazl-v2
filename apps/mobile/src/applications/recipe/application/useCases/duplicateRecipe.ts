import { supabase } from "../../../../lib/supabase";
import { getRecipeById } from "./getRecipeById";

export async function duplicateRecipe(recipeId: string): Promise<string | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const recipe = await getRecipeById(recipeId);
  if (!recipe) return { error: "Recipe not found" };

  const { data: newRecipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      name: `${recipe.name} (copie)`,
      description: recipe.description,
      servings: recipe.servings,
      prep_time_minutes: recipe.prepTimeMinutes,
      cook_time_minutes: recipe.cookTimeMinutes,
      dietary_tags: recipe.dietaryTags,
      image_url: recipe.imageUrl,
      is_public: false,
    })
    .select("id")
    .single();

  if (recipeError || !newRecipe) return { error: recipeError?.message ?? "Failed to duplicate recipe" };

  if (recipe.ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(
      recipe.ingredients.map((ing, i) => ({
        recipe_id: newRecipe.id,
        custom_name: ing.customName,
        product_id: ing.productId,
        quantity: ing.quantity,
        unit: ing.unit,
        is_optional: ing.isOptional,
        sort_order: ing.sortOrder ?? i,
      }))
    );
  }

  if (recipe.steps.length > 0) {
    await supabase.from("recipe_steps").insert(
      recipe.steps.map((step) => ({
        recipe_id: newRecipe.id,
        step_number: step.stepNumber,
        description: step.description,
      }))
    );
  }

  return newRecipe.id;
}
