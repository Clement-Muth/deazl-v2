import { supabase } from "../../../../lib/supabase";

export async function linkShoppingItemProduct(itemId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from("shopping_items")
    .update({ product_id: productId })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
}
