import { supabase } from "../../../../lib/supabase";

export async function clearCheckedItems(listId: string): Promise<void> {
  await supabase.from("shopping_items").delete().eq("shopping_list_id", listId).eq("is_checked", true);
}
