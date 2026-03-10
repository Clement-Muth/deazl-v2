import { supabase } from "../../../../lib/supabase";

export async function deletePantryItem(itemId: string): Promise<void> {
  await supabase.from("pantry_items").delete().eq("id", itemId);
}
