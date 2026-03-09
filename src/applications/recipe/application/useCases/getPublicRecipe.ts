import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/applications/recipe/domain/entities/recipe";

export async function getPublicRecipe(id: string): Promise<Recipe | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recipes")
    .select(`
      *,
      recipe_ingredients(*),
      recipe_steps(*)
    `)
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    servings: data.servings,
    prepTimeMinutes: data.prep_time_minutes,
    cookTimeMinutes: data.cook_time_minutes,
    imageUrl: data.image_url,
    dietaryTags: data.dietary_tags ?? [],
    isPublic: true,
    isFavorite: false,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    ingredients: (data.recipe_ingredients ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((ing: {
        id: string;
        recipe_id: string;
        custom_name: string;
        quantity: number;
        unit: string;
        is_optional: boolean;
        sort_order: number;
      }) => ({
        id: ing.id,
        recipeId: ing.recipe_id,
        customName: ing.custom_name,
        quantity: ing.quantity,
        unit: ing.unit,
        isOptional: ing.is_optional,
        sortOrder: ing.sort_order,
        productId: null,
        nutriscoreGrade: null,
        latestPrice: null,
      })),
    steps: (data.recipe_steps ?? [])
      .sort((a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number)
      .map((step: {
        id: string;
        recipe_id: string;
        step_number: number;
        description: string;
      }) => ({
        id: step.id,
        recipeId: step.recipe_id,
        stepNumber: step.step_number,
        description: step.description,
      })),
  };
}
