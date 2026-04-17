import { supabase } from "../../../../lib/supabase";
import { categorizeItem } from "../../../shopping/domain/categorizeItem";

function normalizeIngredientName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekParam(monday: Date): string {
  return monday.toISOString().slice(0, 10);
}

export async function generateShoppingListFromPlan(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const weekParam = formatWeekParam(getMondayOf(new Date()));

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  await supabase
    .from("shopping_lists")
    .update({ status: "archived" })
    .eq("user_id", user.id)
    .eq("status", "active");

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start", weekParam)
    .single();

  const { data: newList, error: listError } = await supabase
    .from("shopping_lists")
    .insert({
      user_id: user.id,
      household_id: membership?.household_id ?? null,
      meal_plan_id: plan?.id ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (listError || !newList) throw new Error(listError?.message ?? "Failed to create shopping list");

  if (!plan) return;

  const { data: slots } = await supabase
    .from("meal_slots")
    .select("recipe_id")
    .eq("meal_plan_id", plan.id)
    .not("recipe_id", "is", null);

  if (!slots?.length) return;

  const typedSlots = slots as { recipe_id: string | null }[];
  const recipeIds = [...new Set(typedSlots.map((s) => s.recipe_id as string))];

  const [{ data: ingredients }, { data: recipes }, { data: pantryItems }] = await Promise.all([
    supabase
      .from("recipe_ingredients")
      .select("recipe_id, custom_name, quantity, unit, product_id")
      .in("recipe_id", recipeIds),
    supabase
      .from("recipes")
      .select("id, name")
      .in("id", recipeIds),
    supabase
      .from("pantry_items")
      .select("custom_name, quantity, unit")
      .eq("user_id", user.id),
  ]);

  if (!ingredients?.length) return;

  const recipeNameById = new Map((recipes ?? []).map((r: { id: string; name: string }) => [r.id, r.name]));

  type RecipeIngredient = { recipe_id: string; custom_name: string; quantity: number; unit: string; product_id: string | null };
  const typedIngredients = ingredients as RecipeIngredient[];

  const globalAgg = new Map<string, { qty: number; productId: string | null }>();
  for (const ing of typedIngredients) {
    const key = `${normalizeIngredientName(ing.custom_name)}||${ing.unit.trim().toLowerCase()}`;
    const existing = globalAgg.get(key);
    if (existing) {
      existing.qty += ing.quantity;
      if (existing.productId !== ing.product_id) existing.productId = null;
    } else {
      globalAgg.set(key, { qty: ing.quantity, productId: ing.product_id });
    }
  }

  const pantryByKey = new Map<string, number | null>();
  for (const p of (pantryItems ?? []).filter((p) => p.custom_name)) {
    const key = `${normalizeIngredientName(p.custom_name)}||${(p.unit ?? "").trim().toLowerCase()}`;
    const qty = p.quantity ? Number(p.quantity) : null;
    const prev = pantryByKey.get(key);
    if (prev === undefined) {
      pantryByKey.set(key, qty);
    } else if (prev !== null && qty !== null) {
      pantryByKey.set(key, prev + qty);
    } else {
      pantryByKey.set(key, null);
    }
  }

  const coverageRatio = new Map<string, { ratio: number; fullyChecked: boolean; skip: boolean }>();
  for (const [key, { qty: totalNeeded }] of globalAgg) {
    const pantry = pantryByKey.get(key);
    if (pantry === undefined) {
      coverageRatio.set(key, { ratio: 1, fullyChecked: false, skip: false });
    } else if (pantry === null) {
      coverageRatio.set(key, { ratio: 1, fullyChecked: true, skip: false });
    } else if (pantry >= totalNeeded) {
      coverageRatio.set(key, { ratio: 0, fullyChecked: false, skip: true });
    } else {
      coverageRatio.set(key, { ratio: (totalNeeded - pantry) / totalNeeded, fullyChecked: false, skip: false });
    }
  }

  const perRecipeAgg = new Map<string, { customName: string; quantity: number; unit: string; recipeId: string; recipeName: string }>();
  for (const ing of typedIngredients) {
    const key = `${normalizeIngredientName(ing.custom_name)}||${ing.unit.trim().toLowerCase()}||${ing.recipe_id}`;
    const existing = perRecipeAgg.get(key);
    if (existing) {
      existing.quantity += ing.quantity;
    } else {
      perRecipeAgg.set(key, {
        customName: ing.custom_name.trim(),
        quantity: ing.quantity,
        unit: ing.unit.trim(),
        recipeId: ing.recipe_id,
        recipeName: recipeNameById.get(ing.recipe_id) ?? "",
      });
    }
  }

  const shoppingItems: {
    shopping_list_id: string;
    custom_name: string;
    quantity: number;
    unit: string;
    product_id?: string;
    is_checked: boolean;
    sort_order: number;
    category: string;
    recipe_id: string;
    recipe_name: string;
  }[] = [];

  let sortOrder = 0;
  for (const item of perRecipeAgg.values()) {
    const globalKey = `${normalizeIngredientName(item.customName)}||${item.unit.toLowerCase()}`;
    const coverage = coverageRatio.get(globalKey);
    if (!coverage || coverage.skip) continue;
    const quantity = coverage.fullyChecked ? item.quantity : Math.ceil(item.quantity * coverage.ratio * 100) / 100;
    const productId = globalAgg.get(globalKey)?.productId;
    shoppingItems.push({
      shopping_list_id: newList.id,
      custom_name: item.customName,
      quantity,
      unit: item.unit,
      ...(productId ? { product_id: productId } : {}),
      is_checked: coverage.fullyChecked,
      sort_order: sortOrder++,
      category: categorizeItem(item.customName),
      recipe_id: item.recipeId,
      recipe_name: item.recipeName,
    });
  }

  if (shoppingItems.length) {
    await supabase.from("shopping_items").insert(shoppingItems);
  }
}
