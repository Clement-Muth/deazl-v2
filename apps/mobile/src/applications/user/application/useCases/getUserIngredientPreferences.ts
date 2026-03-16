import { supabase } from "../../../../lib/supabase";

export interface IngredientPreference {
  ingredientName: string;
  productId: string;
  productName: string;
  productBrand: string | null;
  productImageUrl: string | null;
}

export async function getUserIngredientPreferences(): Promise<Map<string, IngredientPreference>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Map();

  const { data } = await supabase
    .from("user_ingredient_preferences")
    .select("ingredient_name, product_id, products(id, name, brand, image_url)")
    .eq("user_id", user.id);

  const map = new Map<string, IngredientPreference>();
  for (const row of data ?? []) {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    if (!product) continue;
    map.set(row.ingredient_name, {
      ingredientName: row.ingredient_name,
      productId: row.product_id,
      productName: product.name,
      productBrand: product.brand ?? null,
      productImageUrl: product.image_url ?? null,
    });
  }
  return map;
}
