import { supabase } from "../../../../lib/supabase";
import { normalizeIngredientName } from "../../../shopping/domain/normalizeIngredientName";

export async function autoLinkIngredients(recipeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("id, custom_name, product_id")
    .eq("recipe_id", recipeId)
    .is("product_id", null);

  if (!ingredients || ingredients.length === 0) return;

  const normalizedNames = ingredients
    .map((i) => normalizeIngredientName(i.custom_name ?? ""))
    .filter(Boolean);

  if (normalizedNames.length === 0) return;

  const { data: prefs } = await supabase
    .from("user_ingredient_preferences")
    .select("ingredient_name, product_id")
    .eq("user_id", user.id)
    .in("ingredient_name", normalizedNames);

  if (!prefs || prefs.length === 0) return;

  const prefMap = new Map(prefs.map((p) => [p.ingredient_name, p.product_id]));

  for (const ingredient of ingredients) {
    const normalized = normalizeIngredientName(ingredient.custom_name ?? "");
    const productId = prefMap.get(normalized);
    if (productId) {
      await supabase.from("recipe_ingredients").update({ product_id: productId }).eq("id", ingredient.id);
    }
  }
}
