"use server";

import { createClient } from "@/lib/supabase/server";

export async function reportProductPrice(
  offId: string,
  name: string,
  brand: string | null,
  imageUrl: string | null,
  nutriscoreGrade: string | null,
  storeId: string,
  price: number,
  quantity: number,
  unit: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const { data: upserted, error: upsertError } = await supabase
    .from("products")
    .upsert(
      { off_id: offId, name, brand, image_url: imageUrl, nutriscore_grade: nutriscoreGrade, unit },
      { onConflict: "off_id" },
    )
    .select("id")
    .single();

  if (upsertError || !upserted) return { error: upsertError?.message ?? "Product upsert failed" };

  const { error: priceError } = await supabase.from("prices").insert({
    product_id: upserted.id,
    store_id: storeId,
    price,
    quantity,
    unit,
    reported_by: user.id,
  });

  if (priceError) return { error: priceError.message };
  return {};
}
