import { supabase } from "../../../../lib/supabase";
import { normalizeIngredientName } from "../../../shopping/domain/normalizeIngredientName";

export async function saveIngredientPreference(
  ingredientName: string,
  productId: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const normalized = normalizeIngredientName(ingredientName);
  if (!normalized) return;

  await supabase.from("user_ingredient_preferences").upsert(
    { user_id: user.id, ingredient_name: normalized, product_id: productId, updated_at: new Date().toISOString() },
    { onConflict: "user_id,ingredient_name" },
  );
}
