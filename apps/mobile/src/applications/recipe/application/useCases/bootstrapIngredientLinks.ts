import { supabase } from "../../../../lib/supabase";

export async function bootstrapIngredientLinks(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.rpc("bootstrap_ingredient_links", { p_user_id: user.id });
}
