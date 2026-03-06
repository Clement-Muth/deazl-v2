"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMondayOf, formatWeekParam } from "@/applications/planning/lib/weekUtils";
import { categorizeItem } from "@/applications/shopping/domain/categorizeItem";
import { normalizeIngredientName } from "@/applications/shopping/domain/normalizeIngredientName";

export async function generateShoppingList(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const weekParam = formatWeekParam(getMondayOf(new Date()));

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const householdId: string | null = membership?.household_id ?? null;

  if (householdId) {
    await supabase
      .from("shopping_lists")
      .update({ status: "archived" })
      .eq("household_id", householdId)
      .eq("status", "active");
  } else {
    await supabase
      .from("shopping_lists")
      .update({ status: "archived" })
      .eq("user_id", user.id)
      .eq("status", "active");
  }

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
      household_id: householdId,
      meal_plan_id: plan?.id ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (listError || !newList) throw new Error(listError?.message ?? "Failed to create shopping list");

  if (!plan) {
    revalidatePath("/shopping");
    return;
  }

  const { data: slots } = await supabase
    .from("meal_slots")
    .select("recipe_id")
    .eq("meal_plan_id", plan.id)
    .not("recipe_id", "is", null);

  if (!slots?.length) {
    revalidatePath("/shopping");
    return;
  }

  const recipeIds = [...new Set(slots.map((s) => s.recipe_id as string))];

  const [{ data: ingredients }, { data: pantryItems }] = await Promise.all([
    supabase
      .from("recipe_ingredients")
      .select("custom_name, quantity, unit")
      .in("recipe_id", recipeIds),
    supabase
      .from("pantry_items")
      .select("custom_name, quantity, unit")
      .eq("user_id", user.id),
  ]);

  if (!ingredients?.length) {
    revalidatePath("/shopping");
    return;
  }

  const aggregation = new Map<string, { customName: string; quantity: number; unit: string }>();
  for (const ing of ingredients) {
    const key = `${normalizeIngredientName(ing.custom_name)}||${ing.unit.trim().toLowerCase()}`;
    const existing = aggregation.get(key);
    if (existing) {
      existing.quantity += ing.quantity;
    } else {
      aggregation.set(key, {
        customName: ing.custom_name.trim(),
        quantity: ing.quantity,
        unit: ing.unit.trim(),
      });
    }
  }

  const pantryByName = new Map<string, { quantity: number | null; unit: string }>();
  for (const p of pantryItems ?? []) {
    const key = `${normalizeIngredientName(p.custom_name)}||${(p.unit ?? "").trim().toLowerCase()}`;
    const existing = pantryByName.get(key);
    const qty = p.quantity ? Number(p.quantity) : null;
    if (existing) {
      existing.quantity = ((existing.quantity ?? 0) + (qty ?? 0)) || null;
    } else {
      pantryByName.set(key, { quantity: qty, unit: (p.unit ?? "").trim() });
    }
  }

  const shoppingItems: {
    shopping_list_id: string;
    custom_name: string;
    quantity: number;
    unit: string;
    is_checked: boolean;
    sort_order: number;
    category: string;
  }[] = [];

  let sortOrder = 0;
  for (const item of aggregation.values()) {
    const pantryKey = `${normalizeIngredientName(item.customName)}||${item.unit.toLowerCase()}`;
    const pantry = pantryByName.get(pantryKey);

    if (pantry) {
      if (pantry.quantity === null) {
        shoppingItems.push({
          shopping_list_id: newList.id,
          custom_name: item.customName,
          quantity: item.quantity,
          unit: item.unit,
          is_checked: true,
          sort_order: sortOrder++,
          category: categorizeItem(item.customName),
        });
        continue;
      }
      const remaining = item.quantity - pantry.quantity;
      if (remaining <= 0) continue;
      shoppingItems.push({
        shopping_list_id: newList.id,
        custom_name: item.customName,
        quantity: remaining,
        unit: item.unit,
        is_checked: false,
        sort_order: sortOrder++,
        category: categorizeItem(item.customName),
      });
    } else {
      shoppingItems.push({
        shopping_list_id: newList.id,
        custom_name: item.customName,
        quantity: item.quantity,
        unit: item.unit,
        is_checked: false,
        sort_order: sortOrder++,
        category: categorizeItem(item.customName),
      });
    }
  }

  if (shoppingItems.length) {
    await supabase.from("shopping_items").insert(shoppingItems);
  }

  revalidatePath("/shopping");
}
