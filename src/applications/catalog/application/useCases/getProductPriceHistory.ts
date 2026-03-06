"use server";

import { createClient } from "@/lib/supabase/server";

export interface PriceHistoryPoint {
  date: string;
  price: number;
  storeName: string;
}

export async function getProductPriceHistory(productId: string): Promise<PriceHistoryPoint[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("prices")
    .select("price, reported_at, stores(name)")
    .eq("product_id", productId)
    .order("reported_at", { ascending: true })
    .limit(60);

  return (data ?? []).map((row) => {
    const store = Array.isArray(row.stores) ? row.stores[0] : row.stores;
    return {
      date: new Date(row.reported_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      price: Number(row.price),
      storeName: (store as { name: string } | null)?.name ?? "",
    };
  });
}
