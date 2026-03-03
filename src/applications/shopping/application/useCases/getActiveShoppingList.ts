import { createClient } from "@/lib/supabase/server";
import type { ShoppingList } from "@/applications/shopping/domain/entities/shopping";

export async function getActiveShoppingList(): Promise<ShoppingList | null> {
  const supabase = await createClient();

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id, status, shopping_items(id, custom_name, quantity, unit, is_checked, sort_order)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!list) return null;

  return {
    id: list.id,
    status: list.status as ShoppingList["status"],
    items: (list.shopping_items ?? [])
      .map((item: {
        id: string;
        custom_name: string;
        quantity: number;
        unit: string;
        is_checked: boolean;
        sort_order: number;
      }) => ({
        id: item.id,
        customName: item.custom_name,
        quantity: item.quantity,
        unit: item.unit,
        isChecked: item.is_checked,
        sortOrder: item.sort_order,
      }))
      .sort((a: { isChecked: boolean; sortOrder: number }, b: { isChecked: boolean; sortOrder: number }) => {
        if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
        return a.sortOrder - b.sortOrder;
      }),
  };
}
