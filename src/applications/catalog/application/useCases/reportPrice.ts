"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StoreBrand } from "@/applications/catalog/domain/storeBrands";

export async function reportPrice(
  productId: string,
  recipeId: string,
  storeBrand: StoreBrand,
  price: number,
  quantity: number,
  unit: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const { data: existing } = await supabase
    .from("stores")
    .select("id")
    .eq("brand", storeBrand)
    .eq("created_by", user.id)
    .maybeSingle();

  let storeId: string;
  if (existing) {
    storeId = existing.id;
  } else {
    const { data: newStore, error: storeError } = await supabase
      .from("stores")
      .insert({ name: storeBrand, brand: storeBrand, created_by: user.id })
      .select("id")
      .single();
    if (storeError || !newStore) return { error: "Failed to create store" };
    storeId = newStore.id;
  }

  const { error } = await supabase.from("prices").insert({
    product_id: productId,
    store_id: storeId,
    price,
    quantity,
    unit,
    reported_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/recipes/${recipeId}`);
  return {};
}
