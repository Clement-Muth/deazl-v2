import { supabase } from "../../../../lib/supabase";
import { categorizeItem } from "../../domain/categorizeItem";

export async function addShoppingItem(
  listId: string,
  name: string,
  quantity = 1,
  unit = "pièce"
): Promise<{ itemId?: string; error?: string }> {
  const { data: lastItem } = await supabase
    .from("shopping_items")
    .select("sort_order")
    .eq("shopping_list_id", listId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (lastItem?.sort_order ?? -1) + 1;

  const { data, error } = await supabase.from("shopping_items").insert({
    shopping_list_id: listId,
    custom_name: name.trim(),
    quantity,
    unit,
    is_checked: false,
    sort_order: sortOrder,
    category: categorizeItem(name),
  }).select("id").single();

  if (error) return { error: error.message };
  return { itemId: data.id as string };
}
