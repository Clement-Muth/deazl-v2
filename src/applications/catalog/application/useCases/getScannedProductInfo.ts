"use server";

import { getOFFProduct } from "@/applications/catalog/infrastructure/openFoodFacts";
import { createClient } from "@/lib/supabase/server";

export interface ScannedProductPrice {
  storeId: string;
  storeName: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface ScannedProductInfo {
  offId: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  nutriscoreGrade: string | null;
  prices: ScannedProductPrice[];
}

export async function getScannedProductInfo(ean: string): Promise<ScannedProductInfo | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const product = await getOFFProduct(ean);
  if (!product) return null;

  let prices: ScannedProductPrice[] = [];

  if (user) {
    const [dbProductResult, userStoresResult] = await Promise.all([
      supabase.from("products").select("id").eq("off_id", ean).single(),
      supabase.from("user_stores").select("store_id").eq("user_id", user.id),
    ]);

    const dbProduct = dbProductResult.data;
    const storeIds = (userStoresResult.data ?? []).map((us) => us.store_id);

    if (dbProduct && storeIds.length > 0) {
      const { data } = await supabase
        .from("latest_prices")
        .select("store_id, store_name, price, quantity, unit")
        .eq("product_id", dbProduct.id)
        .in("store_id", storeIds);

      prices = (data ?? []).map((r) => ({
        storeId: r.store_id,
        storeName: r.store_name,
        price: r.price,
        quantity: r.quantity,
        unit: r.unit,
      }));
    }
  }

  return {
    offId: product.offId,
    name: product.name,
    brand: product.brand,
    imageUrl: product.imageUrl,
    nutriscoreGrade: product.nutriscoreGrade,
    prices,
  };
}
