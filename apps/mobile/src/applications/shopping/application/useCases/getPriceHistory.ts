import { supabase } from "../../../../lib/supabase";

export interface PriceHistoryPoint {
  storeId: string;
  storeName: string;
  price: number;
  quantity: number;
  unit: string;
  isPromo: boolean;
  reportedAt: string;
}

export async function getPriceHistory(productId: string): Promise<PriceHistoryPoint[]> {
  const { data } = await supabase
    .from("prices")
    .select("price, quantity, unit, is_promo, reported_at, stores(id, name)")
    .eq("product_id", productId)
    .order("reported_at", { ascending: true })
    .limit(200);

  return (data ?? []).map((row) => {
    const store = Array.isArray(row.stores) ? row.stores[0] : row.stores;
    return {
      storeId: store?.id ?? "",
      storeName: store?.name ?? "",
      price: row.price,
      quantity: row.quantity,
      unit: row.unit,
      isPromo: row.is_promo ?? false,
      reportedAt: row.reported_at,
    };
  });
}
