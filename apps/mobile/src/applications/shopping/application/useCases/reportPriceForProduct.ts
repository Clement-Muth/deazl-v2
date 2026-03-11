import { supabase } from "../../../../lib/supabase";
import type { PromoInfo } from "./reportProductPrice";

export async function reportPriceForProduct(
  productId: string,
  storeId: string,
  price: number,
  quantity: number,
  unit: string,
  promo?: PromoInfo,
): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const { error } = await supabase.from("prices").insert({
    product_id: productId,
    store_id: storeId,
    price,
    quantity,
    unit,
    reported_by: user.id,
    is_promo: !!promo,
    normal_unit_price: promo?.normalUnitPrice ?? null,
    promo_trigger_qty: promo?.promoTriggerQty ?? null,
  });

  if (error) return { error: error.message };
  return {};
}
