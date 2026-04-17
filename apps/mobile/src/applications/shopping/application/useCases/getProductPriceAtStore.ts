import { supabase } from "../../../../lib/supabase";

export async function getProductPriceAtStore(productId: string, storeId: string): Promise<number | null> {
  const { data } = await supabase
    .from("prices")
    .select("price, quantity, unit, is_promo, normal_unit_price")
    .eq("product_id", productId)
    .eq("store_id", storeId)
    .order("reported_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const stablePrice = data.is_promo && data.normal_unit_price != null ? data.normal_unit_price : data.price;
  const u = data.unit.toLowerCase().trim();
  if ((u === "pièce" || u === "piece") && data.quantity > 0) {
    return stablePrice / data.quantity;
  }
  return null;
}
