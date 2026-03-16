import { supabase } from "../../../../lib/supabase";
import { saveIngredientPreference } from "../../../user/application/useCases/saveIngredientPreference";

export async function toggleShoppingItem(
  itemId: string,
  isChecked: boolean,
  productId?: string | null,
  customName?: string | null,
): Promise<void> {
  await supabase.from("shopping_items").update({ is_checked: isChecked }).eq("id", itemId);

  if (isChecked && productId && customName) {
    await saveIngredientPreference(customName, productId);
  }
}
