import { createClient } from "@/lib/supabase/server";
import type { Recipe } from "@/applications/recipe/domain/entities/recipe";

export async function getRecipes(): Promise<Recipe[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("recipes")
    .select(`
      *,
      recipe_ingredients(*),
      recipe_steps(*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    servings: row.servings,
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    imageUrl: row.image_url,
    dietaryTags: row.dietary_tags ?? [],
    isPublic: row.is_public,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    ingredients: (row.recipe_ingredients ?? [])
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
      })),
    steps: (row.recipe_steps ?? [])
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
  }));
}
