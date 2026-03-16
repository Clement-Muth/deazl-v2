import { supabase } from "../../../../lib/supabase";

export async function toggleRecipePublic(recipeId: string, isPublic: boolean): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("recipes")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("id", recipeId);

  if (error) return { error: error.message };
  return {};
}
