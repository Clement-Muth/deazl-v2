import { createClient } from "@/lib/supabase/server";
import { normalizeIngredientName } from "@/applications/shopping/domain/normalizeIngredientName";
import type {
  ShoppingList,
  ShoppingItem,
  ShoppingItemPrice,
  StoreCostSummary,
} from "@/applications/shopping/domain/entities/shopping";

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

interface RawItem {
  id: string;
  custom_name: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
  sort_order: number;
  product_id: string | null;
  category: string | null;
}

interface ProductPriceRow {
  product_id: string;
  store_id: string;
  price: number;
  quantity: number;
  unit: string;
  store_name: string;
  store_city: string;
}

interface IngredientPriceRow {
  ingredient_name: string;
  store_id: string;
  price: number;
  quantity: number;
  unit: string;
  store_name: string;
  store_city: string;
}

export async function getActiveShoppingList(): Promise<ShoppingList | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id, status, shopping_items(id, custom_name, quantity, unit, is_checked, sort_order, product_id, category)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!list) return null;

  const rawItems: RawItem[] = list.shopping_items ?? [];

  const { data: userStores } = await supabase
    .from("user_stores")
    .select("store_id, stores(id, name, city)")
    .eq("user_id", user.id);

  const storeIds = (userStores ?? []).map((us) => us.store_id);
  const storeMap = new Map(
    (userStores ?? []).map((us) => {
      const store = Array.isArray(us.stores) ? us.stores[0] : us.stores;
      return [us.store_id, store as { id: string; name: string; city: string } | null];
    }),
  );

  let productPriceRows: ProductPriceRow[] = [];
  let ingredientPriceRows: IngredientPriceRow[] = [];

  if (rawItems.length > 0 && storeIds.length > 0) {
    const productIds = [...new Set(rawItems.map((i) => i.product_id).filter(Boolean))] as string[];
    if (productIds.length > 0) {
      const { data } = await supabase
        .from("latest_prices")
        .select("product_id, store_id, price, quantity, unit, store_name, store_city")
        .in("product_id", productIds)
        .in("store_id", storeIds);
      productPriceRows = (data ?? []) as ProductPriceRow[];
    }

    const normalizedNames = [...new Set(rawItems.map((i) => normalizeIngredientName(i.custom_name)))];
    const { data } = await supabase
      .from("latest_ingredient_prices")
      .select("ingredient_name, store_id, price, quantity, unit, store_name, store_city")
      .in("ingredient_name", normalizedNames)
      .in("store_id", storeIds);
    ingredientPriceRows = (data ?? []) as IngredientPriceRow[];
  }

  const items: ShoppingItem[] = rawItems
    .map((rawItem) => {
      type Candidate = { store_id: string; price: number; quantity: number; unit: string; store_name: string };
      let candidates: Candidate[] = [];

      if (rawItem.product_id) {
        candidates = productPriceRows.filter((p) => p.product_id === rawItem.product_id);
      }

      if (candidates.length === 0) {
        const normalizedName = normalizeIngredientName(rawItem.custom_name);
        candidates = ingredientPriceRows.filter((p) => p.ingredient_name === normalizedName);
      }

      let price: ShoppingItemPrice | undefined;
      if (candidates.length > 0) {
        const cheapest = candidates.reduce((min, p) => {
          const c = estimateCost(rawItem.quantity, rawItem.unit, p.price, p.quantity, p.unit);
          const m = estimateCost(rawItem.quantity, rawItem.unit, min.price, min.quantity, min.unit);
          return c < m ? p : min;
        });
        const store = storeMap.get(cheapest.store_id);
        price = {
          estimatedCost: estimateCost(
            rawItem.quantity, rawItem.unit,
            cheapest.price, cheapest.quantity, cheapest.unit,
          ),
          storeName: store?.name ?? cheapest.store_name,
        };
      }

      return {
        id: rawItem.id,
        customName: rawItem.custom_name,
        quantity: rawItem.quantity,
        unit: rawItem.unit,
        isChecked: rawItem.is_checked,
        sortOrder: rawItem.sort_order,
        productId: rawItem.product_id,
        category: rawItem.category,
        price,
      };
    })
    .sort((a, b) => {
      if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
      return a.sortOrder - b.sortOrder;
    });

  const storeSummaries: StoreCostSummary[] = [];
  for (const [storeId, store] of storeMap) {
    if (!store) continue;
    let totalCost = 0;
    let coveredCount = 0;
    for (const rawItem of rawItems) {
      let p: { price: number; quantity: number; unit: string } | undefined;

      if (rawItem.product_id) {
        p = productPriceRows.find((r) => r.product_id === rawItem.product_id && r.store_id === storeId);
      }

      if (!p) {
        const normalizedName = normalizeIngredientName(rawItem.custom_name);
        p = ingredientPriceRows.find(
          (r) => r.ingredient_name === normalizedName && r.store_id === storeId,
        );
      }

      if (p) {
        totalCost += estimateCost(rawItem.quantity, rawItem.unit, p.price, p.quantity, p.unit);
        coveredCount++;
      }
    }
    if (coveredCount > 0) {
      storeSummaries.push({
        storeId,
        storeName: store.name,
        storeCity: store.city,
        totalCost,
        coveredCount,
        totalCount: rawItems.length,
      });
    }
  }
  storeSummaries.sort((a, b) => a.totalCost - b.totalCost);

  return {
    id: list.id,
    status: list.status as ShoppingList["status"],
    items,
    storeSummaries,
  };
}
