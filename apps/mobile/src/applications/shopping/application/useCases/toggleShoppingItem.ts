import { supabase } from "../../../../lib/supabase";

export async function toggleShoppingItem(itemId: string, isChecked: boolean): Promise<void> {
  await supabase.from("shopping_items").update({ is_checked: isChecked }).eq("id", itemId);
}
