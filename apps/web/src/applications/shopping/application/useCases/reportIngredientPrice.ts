"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeIngredientName } from "@/applications/shopping/domain/normalizeIngredientName";

export async function reportIngredientPrice(
  ingredientName: string,
  storeId: string,
  price: number,
  quantity: number,
  unit: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const { error } = await supabase.from("ingredient_prices").insert({
    ingredient_name: normalizeIngredientName(ingredientName),
    store_id: storeId,
    price,
    quantity,
    unit,
    reported_by: user.id,
  });

  if (error) return { error: error.message };
  return {};
}
