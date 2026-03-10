import { supabase } from "../../../../lib/supabase";

export async function updatePantryItemQuantity(itemId: string, quantity: number | null): Promise<void> {
  await supabase.from("pantry_items").update({ quantity }).eq("id", itemId);
}
