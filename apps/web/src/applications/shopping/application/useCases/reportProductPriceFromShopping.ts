"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";

export async function reportProductPriceFromShopping(
  shoppingItemId: string,
  product: OFFProduct,
  storeId: string,
  price: number,
  quantity: number,
  unit: string,
): Promise<{ error?: string; productId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const { data: upserted, error: upsertError } = await supabase
    .from("products")
    .upsert(
      {
        off_id: product.offId,
        name: product.name,
        brand: product.brand,
        category: product.category,
        image_url: product.imageUrl,
        nutriscore_grade: product.nutriscoreGrade,
        ecoscore_grade: product.ecoscoreGrade,
        nova_group: product.novaGroup,
        unit,
      },
      { onConflict: "off_id" },
    )
    .select("id")
    .single();

  if (upsertError || !upserted) return { error: upsertError?.message ?? "Product upsert failed" };

  await supabase
    .from("shopping_items")
    .update({ product_id: upserted.id })
    .eq("id", shoppingItemId);

  const { error: priceError } = await supabase.from("prices").insert({
    product_id: upserted.id,
    store_id: storeId,
    price,
    quantity,
    unit,
    reported_by: user.id,
  });

  if (priceError) return { error: priceError.message };

  revalidatePath("/shopping");
  return { productId: upserted.id };
}
