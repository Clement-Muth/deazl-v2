"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { uploadRecipeImage } from "@/applications/recipe/application/uploadRecipeImage";

type RecipeState = { error: string } | undefined;

export async function createRecipe(_prevState: RecipeState, formData: FormData): Promise<RecipeState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  const servings = parseInt(formData.get("servings") as string, 10) || 4;
  const prepTime = formData.get("prep_time") ? parseInt(formData.get("prep_time") as string, 10) : null;
  const cookTime = formData.get("cook_time") ? parseInt(formData.get("cook_time") as string, 10) : null;
  const dietaryTags = formData.getAll("dietary_tag") as string[];

  if (!name?.trim()) return { error: "Recipe name is required" };

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      servings,
      prep_time_minutes: prepTime,
      cook_time_minutes: cookTime,
      dietary_tags: dietaryTags,
    })
    .select("id")
    .single();

  if (recipeError || !recipe) return { error: recipeError?.message ?? "Failed to create recipe" };

  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    const imageUrl = await uploadRecipeImage(recipe.id, imageFile);
    if (imageUrl) {
      await supabase.from("recipes").update({ image_url: imageUrl }).eq("id", recipe.id);
    }
  }

  const ingredientNames = formData.getAll("ingredient_name") as string[];
  const ingredientQuantities = formData.getAll("ingredient_quantity") as string[];
  const ingredientUnits = formData.getAll("ingredient_unit") as string[];

  const ingredients = ingredientNames
    .map((name, i) => ({
      recipe_id: recipe.id,
      custom_name: name.trim(),
      quantity: parseFloat(ingredientQuantities[i] ?? "1") || 1,
      unit: (ingredientUnits[i] ?? "").trim() || "pièce",
      sort_order: i,
    }))
    .filter((ing) => ing.custom_name.length > 0);

  if (ingredients.length > 0) {
    const { error: ingError } = await supabase.from("recipe_ingredients").insert(ingredients);
    if (ingError) return { error: ingError.message };
  }

  const stepDescriptions = formData.getAll("step_description") as string[];
  const steps = stepDescriptions
    .map((desc, i) => ({
      recipe_id: recipe.id,
      step_number: i + 1,
      description: desc.trim(),
    }))
    .filter((step) => step.description.length > 0);

  if (steps.length > 0) {
    const { error: stepError } = await supabase.from("recipe_steps").insert(steps);
    if (stepError) return { error: stepError.message };
  }

  redirect(`/recipes/${recipe.id}`);
}
