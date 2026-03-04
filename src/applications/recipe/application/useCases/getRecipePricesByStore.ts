import { createClient } from "@/lib/supabase/server";

export interface StorePriceSummary {
  storeId: string;
  storeName: string;
  storeCity: string;
  totalCost: number;
  coveredCount: number;
  totalCount: number;
}

interface PriceRow {
  product_id: string;
  store_id: string;
  price: number;
  quantity: number;
  unit: string;
  store_name: string;
  store_city: string;
}

function estimateCost(
  ingQty: number,
  ingUnit: string,
  priceAmt: number,
  priceQty: number,
  priceUnit: string,
): number {
  const norm = (u: string) => u.toLowerCase().trim();
  if (norm(ingUnit) === norm(priceUnit) && priceQty > 0) {
    return (ingQty / priceQty) * priceAmt;
  }
  return priceAmt;
}

export async function getRecipePricesByStore(
  recipeId: string,
): Promise<StorePriceSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: userStores } = await supabase
    .from("user_stores")
    .select("store_id, stores(id, name, city)")
    .eq("user_id", user.id);

  if (!userStores?.length) return [];

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("id, product_id, quantity, unit")
    .eq("recipe_id", recipeId)
    .not("product_id", "is", null);

  if (!ingredients?.length) return [];

  const productIds = ingredients.map((i) => i.product_id as string);
  const storeIds = userStores.map((us) => us.store_id);

  const { data: prices } = await supabase
    .from("latest_prices")
    .select("product_id, store_id, price, quantity, unit, store_name, store_city")
    .in("product_id", productIds)
    .in("store_id", storeIds);

  const priceRows: PriceRow[] = (prices ?? []) as PriceRow[];

  const result: StorePriceSummary[] = [];

  for (const us of userStores) {
    const storeData = Array.isArray(us.stores) ? us.stores[0] : us.stores;
    if (!storeData) continue;

    let totalCost = 0;
    let coveredCount = 0;

    for (const ing of ingredients) {
      const p = priceRows.find(
        (r) => r.product_id === ing.product_id && r.store_id === us.store_id,
      );
      if (p) {
        totalCost += estimateCost(ing.quantity, ing.unit, p.price, p.quantity, p.unit);
        coveredCount++;
      }
    }

    result.push({
      storeId: us.store_id,
      storeName: storeData.name ?? "",
      storeCity: storeData.city ?? "",
      totalCost,
      coveredCount,
      totalCount: ingredients.length,
    });
  }

  return result
    .filter((s) => s.coveredCount > 0)
    .sort((a, b) => a.totalCost - b.totalCost);
}
