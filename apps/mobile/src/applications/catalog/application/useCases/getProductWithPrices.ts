import { supabase } from "../../../../lib/supabase";
import { findOrCreateProduct } from "../../../shopping/application/useCases/findOrCreateProduct";
import type { OFFProductResult } from "../../../shopping/application/useCases/searchOffProducts";
import type { PriceConfidence } from "../../../shopping/domain/entities/shopping";

export interface ProductStorePrice {
  storeId: string;
  storeName: string;
  storeCity: string;
  price: number;
  quantity: number;
  unit: string;
  confidence: PriceConfidence;
  reportedAt: string | null;
  isPromo: boolean;
}

export interface ProductWithPrices {
  productId: string;
  offProduct: OFFProductResult;
  storePrices: ProductStorePrice[];
}

export async function getProductWithPrices(offProduct: OFFProductResult): Promise<ProductWithPrices | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [productId, userStoresResult] = await Promise.all([
    findOrCreateProduct(offProduct),
    supabase.from("user_stores").select("store_id, stores(id, name, city)").eq("user_id", user.id),
  ]);

  if (!productId) return null;

  const userStores = userStoresResult.data;
  const storeIds = (userStores ?? []).map((us) => us.store_id);
  if (storeIds.length === 0) return { productId, offProduct, storePrices: [] };

  const storeMap = new Map(
    (userStores ?? []).map((us) => {
      const store = Array.isArray(us.stores) ? us.stores[0] : us.stores;
      return [us.store_id, store as { id: string; name: string; city: string } | null];
    })
  );

  const { data: priceRows } = await supabase.rpc("get_tiered_prices_for_stores", {
    p_product_ids: [productId],
    p_store_ids: storeIds,
  });

  const storePrices: ProductStorePrice[] = (priceRows ?? [])
    .filter((r: { product_id: string }) => r.product_id === productId)
    .map((r: { store_id: string; price: number; quantity: number; unit: string; confidence: PriceConfidence; reported_at: string | null; is_promo: boolean; normal_unit_price: number | null }) => {
      const store = storeMap.get(r.store_id);
      return {
        storeId: r.store_id,
        storeName: store?.name ?? "",
        storeCity: store?.city ?? "",
        price: r.is_promo && r.normal_unit_price != null ? r.normal_unit_price : r.price,
        quantity: r.quantity,
        unit: r.unit,
        confidence: r.confidence,
        reportedAt: r.reported_at,
        isPromo: r.is_promo,
      };
    })
    .sort((a: ProductStorePrice, b: ProductStorePrice) => a.price - b.price);

  return { productId, offProduct, storePrices };
}
