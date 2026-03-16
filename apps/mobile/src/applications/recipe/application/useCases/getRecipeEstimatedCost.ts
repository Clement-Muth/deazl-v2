import { supabase } from "../../../../lib/supabase";
import { normalizeIngredientName } from "../../../shopping/domain/normalizeIngredientName";

const UNIT_TO_BASE: Record<string, { base: string; factor: number }> = {
  g: { base: "g", factor: 1 },
  gramme: { base: "g", factor: 1 },
  grammes: { base: "g", factor: 1 },
  kg: { base: "g", factor: 1000 },
  kilogramme: { base: "g", factor: 1000 },
  kilogrammes: { base: "g", factor: 1000 },
  ml: { base: "ml", factor: 1 },
  millilitre: { base: "ml", factor: 1 },
  millilitres: { base: "ml", factor: 1 },
  cl: { base: "ml", factor: 10 },
  centilitre: { base: "ml", factor: 10 },
  centilitres: { base: "ml", factor: 10 },
  l: { base: "ml", factor: 1000 },
  litre: { base: "ml", factor: 1000 },
  litres: { base: "ml", factor: 1000 },
  "pièce": { base: "pièce", factor: 1 },
  piece: { base: "pièce", factor: 1 },
  pcs: { base: "pièce", factor: 1 },
  "unité": { base: "pièce", factor: 1 },
  unites: { base: "pièce", factor: 1 },
};

function computeCost(
  recipeQty: number,
  recipeUnit: string,
  priceAmount: number,
  priceQty: number,
  priceUnit: string,
): number | null {
  const rc = UNIT_TO_BASE[recipeUnit.toLowerCase().trim()];
  const pc = UNIT_TO_BASE[priceUnit.toLowerCase().trim()];
  if (!rc || !pc || rc.base !== pc.base) return null;
  const priceBaseQty = priceQty * pc.factor;
  if (priceBaseQty === 0) return null;
  return (recipeQty * rc.factor) / priceBaseQty * priceAmount;
}

interface PriceEntry {
  price: number;
  qty: number;
  unit: string;
  storeId: string;
  confidence: "exact" | "brand_city" | "national";
}

export interface IngredientCostResult {
  ingredientId: string;
  estimatedCost: number | null;
  storeName: string | null;
  confidence: "exact" | "brand_city" | "national" | null;
}

export interface RecipeCostResult {
  totalCost: number | null;
  costPerServing: number | null;
  coveredCount: number;
  totalCount: number;
  ingredientCosts: Map<string, IngredientCostResult>;
}

interface IngredientInput {
  id: string;
  customName: string | null;
  productId: string | null;
  quantity: number;
  unit: string;
}

function emptyResult(ingredients: IngredientInput[]): RecipeCostResult {
  const map = new Map<string, IngredientCostResult>();
  for (const i of ingredients) {
    map.set(i.id, { ingredientId: i.id, estimatedCost: null, storeName: null, confidence: null });
  }
  return { totalCost: null, costPerServing: null, coveredCount: 0, totalCount: ingredients.length, ingredientCosts: map };
}

export async function getRecipeEstimatedCost(
  ingredients: IngredientInput[],
  servings: number,
): Promise<RecipeCostResult> {
  if (ingredients.length === 0) return emptyResult(ingredients);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return emptyResult(ingredients);

  const { data: userStoresData } = await supabase
    .from("user_stores")
    .select("store_id, stores(id, name)")
    .eq("user_id", user.id);

  const storeIds = (userStoresData ?? []).map((s: { store_id: string }) => s.store_id);
  if (storeIds.length === 0) return emptyResult(ingredients);

  const storeNameMap = new Map<string, string>();
  for (const s of userStoresData ?? []) {
    const store = Array.isArray(s.stores) ? s.stores[0] : s.stores;
    if (store) storeNameMap.set(s.store_id, (store as { id: string; name: string }).name);
  }

  const productPrices = new Map<string, PriceEntry[]>();
  const namePrices = new Map<string, PriceEntry[]>();

  const linked = ingredients.filter(i => i.productId);
  const withName = ingredients.filter(i => i.customName);

  const [tieredProductData, tieredNameData] = await Promise.all([
    linked.length > 0
      ? supabase.rpc("get_tiered_prices_for_stores", {
          p_product_ids: [...new Set(linked.map(i => i.productId!))],
          p_store_ids: storeIds,
        })
      : Promise.resolve({ data: null }),
    withName.length > 0
      ? supabase.rpc("get_tiered_ingredient_prices_for_stores", {
          p_ingredient_names: [...new Set(
            withName
              .map(i => normalizeIngredientName(i.customName ?? ""))
              .filter(Boolean)
          )],
          p_store_ids: storeIds,
        })
      : Promise.resolve({ data: null }),
  ]);

  if (tieredProductData.data) {
    for (const row of tieredProductData.data as Array<{
      product_id: string;
      store_id: string;
      price: string | number;
      quantity: string | number;
      unit: string;
      confidence: string;
    }>) {
      const entry: PriceEntry = {
        price: Number(row.price),
        qty: Number(row.quantity),
        unit: row.unit,
        storeId: row.store_id,
        confidence: row.confidence as PriceEntry["confidence"],
      };
      const list = productPrices.get(row.product_id) ?? [];
      list.push(entry);
      productPrices.set(row.product_id, list);
    }
  }

  if (tieredNameData.data) {
    for (const row of tieredNameData.data as Array<{
      ingredient_name: string;
      store_id: string;
      price: string | number;
      quantity: string | number;
      unit: string;
      confidence: string;
    }>) {
      const entry: PriceEntry = {
        price: Number(row.price),
        qty: Number(row.quantity),
        unit: row.unit,
        storeId: row.store_id,
        confidence: row.confidence as PriceEntry["confidence"],
      };
      const list = namePrices.get(row.ingredient_name) ?? [];
      list.push(entry);
      namePrices.set(row.ingredient_name, list);
    }
  }

  const ingredientCosts = new Map<string, IngredientCostResult>();
  let totalCost = 0;
  let coveredCount = 0;

  for (const ing of ingredients) {
    const productEntries = ing.productId ? (productPrices.get(ing.productId) ?? []) : [];
    const nameEntries = ing.customName
      ? (namePrices.get(normalizeIngredientName(ing.customName)) ?? [])
      : [];
    const entries = productEntries.length > 0 ? productEntries : nameEntries;

    let bestCost: number | null = null;
    let bestEntry: PriceEntry | null = null;

    for (const entry of entries) {
      const cost = computeCost(ing.quantity, ing.unit, entry.price, entry.qty, entry.unit);
      if (cost !== null && (bestCost === null || cost < bestCost)) {
        bestCost = cost;
        bestEntry = entry;
      }
    }

    const storeName = bestEntry?.confidence === "exact"
      ? (storeNameMap.get(bestEntry.storeId) ?? null)
      : null;

    ingredientCosts.set(ing.id, {
      ingredientId: ing.id,
      estimatedCost: bestCost,
      storeName,
      confidence: bestEntry?.confidence ?? null,
    });

    if (bestCost !== null) {
      totalCost += bestCost;
      coveredCount++;
    }
  }

  const finalTotal = coveredCount > 0 ? totalCost : null;

  return {
    totalCost: finalTotal,
    costPerServing: finalTotal !== null && servings > 0 ? finalTotal / servings : null,
    coveredCount,
    totalCount: ingredients.length,
    ingredientCosts,
  };
}
