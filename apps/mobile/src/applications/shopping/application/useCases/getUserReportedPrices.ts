import { supabase } from "../../../../lib/supabase";

export interface ReportedPrice {
  id: string;
  productId: string;
  productName: string;
  productBrand: string | null;
  productImageUrl: string | null;
  isGeneric: boolean;
  storeId: string;
  storeName: string;
  price: number;
  quantity: number;
  unit: string;
  isPromo: boolean;
  reportedAt: string;
}

export async function getUserReportedPrices(): Promise<ReportedPrice[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("prices")
    .select("id, price, quantity, unit, is_promo, reported_at, products(id, name, brand, image_url, off_id), stores(id, name)")
    .eq("reported_by", user.id)
    .order("reported_at", { ascending: false });

  const seen = new Set<string>();
  return (data ?? [])
    .map((row) => {
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      const store = Array.isArray(row.stores) ? row.stores[0] : row.stores;
      return {
        id: row.id,
        productId: product?.id ?? "",
        productName: product?.name ?? "Produit inconnu",
        productBrand: product?.brand ?? null,
        productImageUrl: product?.image_url ?? null,
        isGeneric: product?.off_id == null,
        storeId: store?.id ?? "",
        storeName: store?.name ?? "",
        price: row.price,
        quantity: row.quantity,
        unit: row.unit,
        isPromo: row.is_promo ?? false,
        reportedAt: row.reported_at,
      };
    })
    .filter((p) => {
      const key = `${p.productId}__${p.storeId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export async function deleteReportedPrice(id: string): Promise<void> {
  await supabase.from("prices").delete().eq("id", id);
}
