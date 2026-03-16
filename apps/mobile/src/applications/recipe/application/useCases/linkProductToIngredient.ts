import { supabase } from "../../../../lib/supabase";
import { saveIngredientPreference } from "../../../user/application/useCases/saveIngredientPreference";

export async function linkProductToIngredient(ingredientId: string, productId: string | null): Promise<void> {
  const { data: ingredient, error } = await supabase
    .from("recipe_ingredients")
    .update({ product_id: productId })
    .eq("id", ingredientId)
    .select("custom_name")
    .single();

  if (error) throw new Error(error.message);

  if (productId && ingredient?.custom_name) {
    await saveIngredientPreference(ingredient.custom_name, productId);
  }
}
