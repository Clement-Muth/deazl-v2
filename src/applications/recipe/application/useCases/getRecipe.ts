import { createClient } from "@/lib/supabase/server";
import type { Recipe, IngredientPrice } from "@/applications/recipe/domain/entities/recipe";

export async function getRecipe(id: string): Promise<Recipe | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recipes")
    .select(`
      *,
      recipe_ingredients(*, products(id, nutriscore_grade)),
      recipe_steps(*)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const productIds = (data.recipe_ingredients ?? [])
    .map((i: { products: { id: string } | null }) => i.products?.id)
    .filter(Boolean) as string[];

  const pricesByProductId = new Map<string, IngredientPrice>();
  if (productIds.length > 0) {
    const { data: prices } = await supabase
      .from("latest_prices")
      .select("product_id, price, quantity, unit, store_name, store_brand")
      .in("product_id", productIds);
    for (const p of prices ?? []) {
      if (!pricesByProductId.has(p.product_id)) {
        pricesByProductId.set(p.product_id, {
          price: p.price,
          quantity: p.quantity,
          unit: p.unit,
          storeName: p.store_name,
          storeBrand: p.store_brand,
        });
      }
    }
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    servings: data.servings,
    prepTimeMinutes: data.prep_time_minutes,
    cookTimeMinutes: data.cook_time_minutes,
    imageUrl: data.image_url,
    isPublic: data.is_public,
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
        product_id: string | null;
        products: { id: string; nutriscore_grade: string | null } | null;
      }) => ({
        id: ing.id,
        recipeId: ing.recipe_id,
        customName: ing.custom_name,
        quantity: ing.quantity,
        unit: ing.unit,
        isOptional: ing.is_optional,
        sortOrder: ing.sort_order,
        productId: ing.product_id,
        nutriscoreGrade: ing.products?.nutriscore_grade ?? null,
        latestPrice: ing.products ? (pricesByProductId.get(ing.products.id) ?? null) : null,
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
