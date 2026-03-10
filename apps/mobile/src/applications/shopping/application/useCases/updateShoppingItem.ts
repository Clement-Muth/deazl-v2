import { supabase } from "../../../../lib/supabase";

export async function updateShoppingItem(
  id: string,
  name: string,
  quantity: number,
  unit: string,
): Promise<void> {
  await supabase
    .from("shopping_items")
    .update({ custom_name: name, quantity, unit })
    .eq("id", id);
}
