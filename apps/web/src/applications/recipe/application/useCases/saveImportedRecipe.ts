"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ImportedRecipe } from "./importRecipeFromUrl";

export async function saveImportedRecipe(recipe: ImportedRecipe): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: created, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: user.id,
      name: recipe.name,
      description: recipe.description,
      servings: recipe.servings,
      prep_time_minutes: recipe.prepTimeMinutes,
      cook_time_minutes: recipe.cookTimeMinutes,
      image_url: recipe.imageUrl,
    })
    .select("id")
    .single();

  if (recipeError || !created) return { error: recipeError?.message ?? "Erreur lors de la création" };

  if (recipe.ingredients.length > 0) {
    await supabase.from("recipe_ingredients").insert(
      recipe.ingredients.map((ing, i) => ({
        recipe_id: created.id,
        custom_name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        sort_order: i,
      }))
    );
  }

  if (recipe.steps.length > 0) {
    await supabase.from("recipe_steps").insert(
      recipe.steps.map((desc, i) => ({
        recipe_id: created.id,
        step_number: i + 1,
        description: desc,
      }))
    );
  }

  redirect(`/recipes/${created.id}`);
}
