import { supabase } from "../../../../lib/supabase";
import { normalizeIngredientName } from "../../../shopping/domain/normalizeIngredientName";

function toBaseUnit(qty: number, unit: string): [number, string] {
  const u = unit.toLowerCase().trim();
  if (u === "kg") return [qty * 1000, "g"];
  if (u === "l" || u === "litre" || u === "litres" || u === "liter" || u === "liters") return [qty * 1000, "ml"];
  if (u === "cl") return [qty * 10, "ml"];
  if (u === "càs" || u === "c. à s." || u === "c.à.s" || u === "tbsp" || u === "cs") return [qty * 15, "ml"];
  if (u === "càc" || u === "c. à c." || u === "c.à.c" || u === "tsp" || u === "cc") return [qty * 5, "ml"];
  return [qty, u];
}

function estimateCost(ingQty: number, ingUnit: string, priceAmt: number, priceQty: number, priceUnit: string): number | null {
  const [normIngQty, normIngUnit] = toBaseUnit(ingQty, ingUnit);
  const [normPriceQty, normPriceUnit] = toBaseUnit(priceQty, priceUnit);
  if (normIngUnit === normPriceUnit && normPriceQty > 0) {
    return (normIngQty / normPriceQty) * priceAmt;
  }
  return null;
}

export interface BatchIngredientCost {
  name: string;
  quantity: number;
  unit: string;
  cost: number | null;
}

export interface BatchRecipeCost {
  recipeId: string;
  recipeName: string;
  cost: number;
  missingPriceCount: number;
  ingredients: BatchIngredientCost[];
}

export interface BatchCookingCost {
  recipeCosts: BatchRecipeCost[];
  totalIngredientsCost: number;
  totalMissingPriceCount: number;
  servingsPerMeal: number;
  hasData: boolean;
}

type IngredientItem = { custom_name: string | null; quantity: number; unit: string; recipe_id: string | null };

export async function getBatchCookingCost(
  weekStart: string,
  recipeIds: string[],
  recipeNames: Record<string, string>,
): Promise<BatchCookingCost> {
  const empty: BatchCookingCost = { recipeCosts: [], totalIngredientsCost: 0, totalMissingPriceCount: 0, servingsPerMeal: 1, hasData: false };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return empty;

  let rawItems: IngredientItem[] | null = null;
  let servingsPerMeal = 1;

  const { data: mealPlan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (mealPlan) {
    const { data: slotsForServings } = await supabase
      .from("meal_slots")
      .select("servings")
      .eq("meal_plan_id", mealPlan.id)
      .in("recipe_id", recipeIds)
      .limit(1)
      .maybeSingle();
    if (slotsForServings?.servings) servingsPerMeal = slotsForServings.servings;

    const { data: shoppingList } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("meal_plan_id", mealPlan.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (shoppingList) {
      const { data } = await supabase
        .from("shopping_items")
        .select("custom_name, quantity, unit, recipe_id")
        .eq("shopping_list_id", shoppingList.id)
        .in("recipe_id", recipeIds);
      if (data?.length) rawItems = data;
    }
  }

  if (!rawItems) {
    const { data: ingRows } = await supabase
      .from("recipe_ingredients")
      .select("recipe_id, custom_name, quantity, unit, products(name), recipes(servings)")
      .in("recipe_id", recipeIds);

    if (!ingRows?.length) return empty;

    const scaleMap = new Map<string, number>();
    if (mealPlan) {
      const { data: slots } = await supabase
        .from("meal_slots")
        .select("recipe_id, servings")
        .eq("meal_plan_id", mealPlan.id)
        .in("recipe_id", recipeIds);

      if (slots?.length) {
        const slotsByRecipe = new Map<string, { count: number; servings: number }>();
        for (const slot of slots) {
          const curr = slotsByRecipe.get(slot.recipe_id) ?? { count: 0, servings: slot.servings };
          slotsByRecipe.set(slot.recipe_id, { count: curr.count + 1, servings: slot.servings });
        }
        for (const [recipeId, { count, servings }] of slotsByRecipe) {
          scaleMap.set(recipeId, count * servings);
        }
      }
    }

    rawItems = (ingRows as Array<{
      recipe_id: string;
      custom_name: string | null;
      quantity: number;
      unit: string;
      products: { name: string } | null;
      recipes: { servings: number } | null;
    }>).map((row) => {
      const name = row.custom_name ?? row.products?.name ?? null;
      let quantity = row.quantity;
      const totalBatchServings = scaleMap.get(row.recipe_id);
      const recipeDefaultServings = row.recipes?.servings;
      if (totalBatchServings && recipeDefaultServings && recipeDefaultServings > 0) {
        quantity = (row.quantity * totalBatchServings) / recipeDefaultServings;
      }
      return { custom_name: name, quantity, unit: row.unit, recipe_id: row.recipe_id };
    });
  }

  if (!rawItems?.length) return empty;

  const { data: userStores } = await supabase
    .from("user_stores")
    .select("store_id")
    .eq("user_id", user.id);

  const storeIds = (userStores ?? []).map((us) => us.store_id);

  type PriceRow = { ingredient_name: string; store_id: string; price: number; quantity: number; unit: string; is_promo: boolean; normal_unit_price: number | null };
  let priceRows: PriceRow[] = [];

  if (storeIds.length > 0) {
    const normalizedNames = [...new Set(rawItems.filter((i) => i.custom_name).map((i) => normalizeIngredientName(i.custom_name!)))];
    const { data } = await supabase.rpc("get_tiered_ingredient_prices_for_stores", {
      p_ingredient_names: normalizedNames,
      p_store_ids: storeIds,
    });
    priceRows = (data ?? []) as PriceRow[];
  }

  const recipeCostMap = new Map<string, { cost: number; missingPriceCount: number; ingredients: BatchIngredientCost[] }>();
  for (const id of recipeIds) {
    recipeCostMap.set(id, { cost: 0, missingPriceCount: 0, ingredients: [] });
  }

  for (const item of rawItems) {
    if (!item.recipe_id || !item.custom_name) continue;
    const entry = recipeCostMap.get(item.recipe_id);
    if (!entry) continue;

    const normalizedName = normalizeIngredientName(item.custom_name);
    const candidates = priceRows.filter((r) => r.ingredient_name === normalizedName);

    if (candidates.length === 0) {
      entry.missingPriceCount++;
      entry.ingredients.push({ name: item.custom_name, quantity: item.quantity, unit: item.unit, cost: null });
      continue;
    }

    let cheapest: number | null = null;
    for (const row of candidates) {
      const sp = row.is_promo && row.normal_unit_price != null ? row.normal_unit_price : row.price;
      const cost = estimateCost(item.quantity, item.unit, sp, row.quantity, row.unit);
      if (cost !== null && (cheapest === null || cost < cheapest)) cheapest = cost;
    }

    if (cheapest === null) {
      entry.missingPriceCount++;
      entry.ingredients.push({ name: item.custom_name, quantity: item.quantity, unit: item.unit, cost: null });
    } else {
      entry.cost += cheapest;
      entry.ingredients.push({ name: item.custom_name, quantity: item.quantity, unit: item.unit, cost: cheapest });
    }
  }

  const recipeCosts: BatchRecipeCost[] = recipeIds.map((id) => {
    const entry = recipeCostMap.get(id) ?? { cost: 0, missingPriceCount: 0, ingredients: [] };
    return {
      recipeId: id,
      recipeName: recipeNames[id] ?? "Recette",
      cost: entry.cost,
      missingPriceCount: entry.missingPriceCount,
      ingredients: entry.ingredients,
    };
  });

  const totalIngredientsCost = recipeCosts.reduce((sum, r) => sum + r.cost, 0);
  const totalMissingPriceCount = recipeCosts.reduce((sum, r) => sum + r.missingPriceCount, 0);

  return { recipeCosts, totalIngredientsCost, totalMissingPriceCount, servingsPerMeal, hasData: true };
}
