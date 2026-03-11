import { supabase } from "../../../../lib/supabase";
import { normalizeIngredientName } from "../../domain/normalizeIngredientName";
import type {
  ShoppingList,
  ShoppingItem,
  ShoppingItemPrice,
  ShoppingItemStorePrice,
  StoreCostSummary,
  PriceConfidence,
} from "../../domain/entities/shopping";

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

interface TieredPriceRow {
  product_id: string;
  store_id: string;
  price: number;
  quantity: number;
  unit: string;
  confidence: PriceConfidence;
  reported_at: string | null;
  reporter_count: number;
  is_promo: boolean;
  normal_unit_price: number | null;
  promo_trigger_qty: number | null;
}

interface TieredIngredientPriceRow {
  ingredient_name: string;
  store_id: string;
  price: number;
  quantity: number;
  unit: string;
  confidence: PriceConfidence;
  reported_at: string | null;
  reporter_count: number;
  is_promo: boolean;
  normal_unit_price: number | null;
  promo_trigger_qty: number | null;
}

export async function getActiveShoppingList(): Promise<ShoppingList | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const listQuery = supabase
    .from("shopping_lists")
    .select("id, status, shopping_items(id, custom_name, quantity, unit, is_checked, sort_order, product_id, category)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  if (membership?.household_id) {
    listQuery.eq("household_id", membership.household_id);
  } else {
    listQuery.eq("user_id", user.id);
  }

  const { data: list } = await listQuery.maybeSingle();

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

  let productPriceRows: TieredPriceRow[] = [];
  let ingredientPriceRows: TieredIngredientPriceRow[] = [];

  if (rawItems.length > 0 && storeIds.length > 0) {
    const productIds = [...new Set(rawItems.map((i) => i.product_id).filter(Boolean))] as string[];
    if (productIds.length > 0) {
      const { data } = await supabase.rpc("get_tiered_prices_for_stores", {
        p_product_ids: productIds,
        p_store_ids: storeIds,
      });
      productPriceRows = (data ?? []) as TieredPriceRow[];
    }

    const normalizedNames = [...new Set(rawItems.map((i) => normalizeIngredientName(i.custom_name)))];
    const { data } = await supabase.rpc("get_tiered_ingredient_prices_for_stores", {
      p_ingredient_names: normalizedNames,
      p_store_ids: storeIds,
    });
    ingredientPriceRows = (data ?? []) as TieredIngredientPriceRow[];
  }

  const items: ShoppingItem[] = rawItems
    .map((rawItem) => {
      type Candidate = { store_id: string; price: number; quantity: number; unit: string; confidence: PriceConfidence; reported_at: string | null; reporter_count: number; is_promo: boolean; normal_unit_price: number | null; promo_trigger_qty: number | null };
      let candidates: Candidate[] = [];

      if (rawItem.product_id) {
        candidates = productPriceRows.filter((p) => p.product_id === rawItem.product_id);
      }

      if (candidates.length === 0) {
        const normalizedName = normalizeIngredientName(rawItem.custom_name);
        candidates = ingredientPriceRows.filter((p) => p.ingredient_name === normalizedName);
      }

      const allStorePrices: ShoppingItemStorePrice[] = [];
      for (const [storeId, store] of storeMap) {
        if (!store) continue;
        const candidate = candidates.find((c) => c.store_id === storeId);
        if (candidate) {
          const stablePrice = candidate.is_promo && candidate.normal_unit_price != null
            ? candidate.normal_unit_price
            : candidate.price;
          allStorePrices.push({
            storeId,
            storeName: store.name,
            estimatedCost: estimateCost(rawItem.quantity, rawItem.unit, stablePrice, candidate.quantity, candidate.unit),
            confidence: candidate.confidence,
            reportedAt: candidate.reported_at,
            reporterCount: candidate.reporter_count,
            isPromo: candidate.is_promo,
            normalUnitPrice: candidate.normal_unit_price,
            promoTriggerQty: candidate.promo_trigger_qty,
          });
        }
      }

      let price: ShoppingItemPrice | undefined;
      if (candidates.length > 0) {
        const stablePrice = (c: typeof candidates[number]) =>
          c.is_promo && c.normal_unit_price != null ? c.normal_unit_price : c.price;
        const cheapest = candidates.reduce((min, p) => {
          const c = estimateCost(rawItem.quantity, rawItem.unit, stablePrice(p), p.quantity, p.unit);
          const m = estimateCost(rawItem.quantity, rawItem.unit, stablePrice(min), min.quantity, min.unit);
          return c < m ? p : min;
        });
        const store = storeMap.get(cheapest.store_id);
        price = {
          estimatedCost: estimateCost(rawItem.quantity, rawItem.unit, stablePrice(cheapest), cheapest.quantity, cheapest.unit),
          storeName: store?.name ?? "",
          confidence: cheapest.confidence,
          reportedAt: cheapest.reported_at,
          reporterCount: cheapest.reporter_count,
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
        allStorePrices,
      };
    })
    .sort((a, b) => {
      if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
      return a.sortOrder - b.sortOrder;
    });

  const uncheckedItems = rawItems.filter((i) => !i.is_checked);

  const storeSummaries: StoreCostSummary[] = [];
  for (const [storeId, store] of storeMap) {
    if (!store) continue;
    let totalCost = 0;
    let coveredCount = 0;
    let hasEstimates = false;
    let latestReportedAt: string | null = null;

    for (const rawItem of uncheckedItems) {
      let p: { price: number; quantity: number; unit: string; confidence: PriceConfidence; reported_at: string | null; is_promo: boolean; normal_unit_price: number | null } | undefined;

      if (rawItem.product_id) {
        p = productPriceRows.find((r) => r.product_id === rawItem.product_id && r.store_id === storeId);
      }

      if (!p) {
        const normalizedName = normalizeIngredientName(rawItem.custom_name);
        p = ingredientPriceRows.find((r) => r.ingredient_name === normalizedName && r.store_id === storeId);
      }

      if (p) {
        const sp = p.is_promo && p.normal_unit_price != null ? p.normal_unit_price : p.price;
        totalCost += estimateCost(rawItem.quantity, rawItem.unit, sp, p.quantity, p.unit);
        coveredCount++;
        if (p.confidence !== "exact") hasEstimates = true;
        if (p.reported_at && (!latestReportedAt || p.reported_at > latestReportedAt)) {
          latestReportedAt = p.reported_at;
        }
      }
    }
    if (coveredCount > 0) {
      storeSummaries.push({
        storeId,
        storeName: store.name,
        storeCity: store.city,
        totalCost,
        coveredCount,
        totalCount: uncheckedItems.length,
        hasEstimates,
        latestReportedAt,
      });
    }
  }
  storeSummaries.sort((a, b) => a.totalCost - b.totalCost);

  const uncheckedForTotal = items.filter((i) => !i.isChecked);
  const estimatedTotal = uncheckedForTotal.reduce((sum, i) => sum + (i.price?.estimatedCost ?? 0), 0);
  const itemsWithoutPrice = uncheckedForTotal.filter((i) => !i.price).length;

  return {
    id: list.id,
    status: list.status as ShoppingList["status"],
    items,
    storeSummaries,
    estimatedTotal,
    itemsWithoutPrice,
  };
}
