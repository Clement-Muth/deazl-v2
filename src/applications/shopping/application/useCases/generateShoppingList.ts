"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMondayOf, formatWeekParam } from "@/applications/planning/lib/weekUtils";
import { categorizeItem } from "@/applications/shopping/domain/categorizeItem";

export async function generateShoppingList(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const weekParam = formatWeekParam(getMondayOf(new Date()));

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

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("custom_name, quantity, unit")
    .in("recipe_id", recipeIds);

  if (!ingredients?.length) {
    revalidatePath("/shopping");
    return;
  }

  const aggregation = new Map<string, { customName: string; quantity: number; unit: string }>();
  for (const ing of ingredients) {
    const key = `${ing.custom_name.trim().toLowerCase()}||${ing.unit.trim().toLowerCase()}`;
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

  const items = Array.from(aggregation.values()).map((item, i) => ({
    shopping_list_id: newList.id,
    custom_name: item.customName,
    quantity: item.quantity,
    unit: item.unit,
    is_checked: false,
    sort_order: i,
    category: categorizeItem(item.customName),
  }));

  await supabase.from("shopping_items").insert(items);

  revalidatePath("/shopping");
}
