import { supabase } from "../../../lib/supabase";
import type { Recipe } from "../domain/entities/recipe";

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data, error }, { data: favorites }] = await Promise.all([
    supabase
      .from("recipes")
      .select("*, recipe_ingredients(*, products(id, name)), recipe_steps(*)")
      .order("created_at", { ascending: false }),
    supabase
      .from("recipe_favorites")
      .select("recipe_id")
      .eq("user_id", user.id),
  ]);

  if (error || !data) return [];

  const favoriteIds = new Set((favorites ?? []).map((f: { recipe_id: string }) => f.recipe_id));

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
    isFavorite: favoriteIds.has(row.id),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    ingredients: (row.recipe_ingredients ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((ing: { id: string; recipe_id: string; custom_name: string | null; product_id: string | null; products: { id: string; name: string } | null; quantity: number; unit: string; is_optional: boolean; sort_order: number }) => ({
        id: ing.id,
        recipeId: ing.recipe_id,
        customName: ing.custom_name,
        productId: ing.product_id,
        productName: ing.products?.name ?? null,
        quantity: ing.quantity,
        unit: ing.unit,
        isOptional: ing.is_optional,
        sortOrder: ing.sort_order,
      })),
    steps: (row.recipe_steps ?? [])
      .sort((a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number)
      .map((step: { id: string; recipe_id: string; step_number: number; description: string }) => ({
        id: step.id,
        recipeId: step.recipe_id,
        stepNumber: step.step_number,
        description: step.description,
      })),
  }));
}

export async function fetchRecipeById(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*, products(id, name)), recipe_steps(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const { data: fav } = await supabase
    .from("recipe_favorites")
    .select("recipe_id")
    .eq("recipe_id", id)
    .maybeSingle();

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
    isPublic: data.is_public,
    isFavorite: !!fav,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    ingredients: (data.recipe_ingredients ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((ing: { id: string; recipe_id: string; custom_name: string | null; product_id: string | null; products: { id: string; name: string } | null; quantity: number; unit: string; is_optional: boolean; sort_order: number }) => ({
        id: ing.id,
        recipeId: ing.recipe_id,
        customName: ing.custom_name,
        productId: ing.product_id,
        productName: ing.products?.name ?? null,
        quantity: ing.quantity,
        unit: ing.unit,
        isOptional: ing.is_optional,
        sortOrder: ing.sort_order,
      })),
    steps: (data.recipe_steps ?? [])
      .sort((a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number)
      .map((step: { id: string; recipe_id: string; step_number: number; description: string }) => ({
        id: step.id,
        recipeId: step.recipe_id,
        stepNumber: step.step_number,
        description: step.description,
      })),
  };
}
