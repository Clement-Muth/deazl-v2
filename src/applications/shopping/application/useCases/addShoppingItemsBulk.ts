"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categorizeItem } from "@/applications/shopping/domain/categorizeItem";

export async function addShoppingItemsBulk(
  listId: string,
  items: { name: string; quantity: number; unit: string }[],
): Promise<{ error?: string }> {
  if (items.length === 0) return {};

  const supabase = await createClient();

  const { data: lastItem } = await supabase
    .from("shopping_items")
    .select("sort_order")
    .eq("shopping_list_id", listId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const baseOrder = (lastItem?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("shopping_items").insert(
    items.map((item, i) => ({
      shopping_list_id: listId,
      custom_name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      is_checked: false,
      sort_order: baseOrder + i,
      category: categorizeItem(item.name),
    })),
  );

  if (error) return { error: error.message };

  revalidatePath("/shopping");
  return {};
}
