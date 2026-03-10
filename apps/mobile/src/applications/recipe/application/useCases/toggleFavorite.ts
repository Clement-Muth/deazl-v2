import { supabase } from "../../../../lib/supabase";

export async function toggleFavorite(recipeId: string, isFavorite: boolean): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (isFavorite) {
    await supabase
      .from("recipe_favorites")
      .upsert({ recipe_id: recipeId, user_id: user.id }, { onConflict: "recipe_id,user_id" });
  } else {
    await supabase
      .from("recipe_favorites")
      .delete()
      .eq("recipe_id", recipeId)
      .eq("user_id", user.id);
  }
}
