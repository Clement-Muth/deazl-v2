import { supabase } from "../../../../lib/supabase";
import { saveIngredientPreference } from "../../../user/application/useCases/saveIngredientPreference";

export async function linkShoppingItemProduct(itemId: string, productId: string): Promise<void> {
  const { data: item, error } = await supabase
    .from("shopping_items")
    .update({ product_id: productId })
    .eq("id", itemId)
    .select("custom_name")
    .single();

  if (error) throw new Error(error.message);

  if (item?.custom_name) {
    await saveIngredientPreference(item.custom_name, productId);
  }
}
