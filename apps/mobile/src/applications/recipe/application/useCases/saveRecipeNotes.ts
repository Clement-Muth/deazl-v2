import { supabase } from "../../../../lib/supabase";

export async function saveRecipeNotes(recipeId: string, notes: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("recipe_user_notes")
    .upsert(
      { user_id: user.id, recipe_id: recipeId, notes, updated_at: new Date().toISOString() },
      { onConflict: "user_id,recipe_id" }
    );
}
