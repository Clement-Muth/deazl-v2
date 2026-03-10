import { supabase } from "../../../../lib/supabase";

export async function deleteShoppingItem(itemId: string): Promise<void> {
  await supabase.from("shopping_items").delete().eq("id", itemId);
}
