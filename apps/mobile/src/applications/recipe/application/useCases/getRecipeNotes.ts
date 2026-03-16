import { supabase } from "../../../../lib/supabase";

export async function getRecipeNotes(recipeId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "";
  const { data } = await supabase
    .from("recipe_user_notes")
    .select("notes")
    .eq("recipe_id", recipeId)
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.notes ?? "";
}
