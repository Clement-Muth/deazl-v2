import { supabase } from "../../../../lib/supabase";
import type { OFFProductResult } from "./searchOffProducts";

export interface PromoInfo {
  normalUnitPrice: number;
  promoTriggerQty: number;
}

export async function reportProductPrice(
  product: OFFProductResult,
  storeId: string,
  price: number,
  quantity: number,
  unit: string,
  promo?: PromoInfo,
): Promise<{ error?: string; productId?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: upserted, error: upsertError } = await supabase
    .from("products")
    .upsert(
      {
        off_id: product.offId,
        name: product.name,
        brand: product.brand,
        image_url: product.imageUrl,
        nutriscore_grade: product.nutriscoreGrade,
        unit,
      },
      { onConflict: "off_id" },
    )
    .select("id")
    .single();

  if (upsertError || !upserted) return { error: upsertError?.message ?? "Erreur produit" };

  const { error: priceError } = await supabase.from("prices").insert({
    product_id: upserted.id,
    store_id: storeId,
    price,
    quantity,
    unit,
    reported_by: user.id,
    is_promo: !!promo,
    normal_unit_price: promo?.normalUnitPrice ?? null,
    promo_trigger_qty: promo?.promoTriggerQty ?? null,
  });

  if (priceError) return { error: priceError.message };
  return { productId: upserted.id };
}
