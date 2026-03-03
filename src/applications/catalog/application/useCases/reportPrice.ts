"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reportPrice(
  productId: string,
  recipeId: string,
  storeId: string,
  price: number,
  quantity: number,
  unit: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

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
