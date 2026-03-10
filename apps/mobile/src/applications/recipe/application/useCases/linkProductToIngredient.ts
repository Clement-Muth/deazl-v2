import { supabase } from "../../../../lib/supabase";

export async function linkProductToIngredient(ingredientId: string, productId: string | null): Promise<void> {
  const { error } = await supabase
    .from("recipe_ingredients")
    .update({ product_id: productId })
    .eq("id", ingredientId);

  if (error) throw new Error(error.message);
}
