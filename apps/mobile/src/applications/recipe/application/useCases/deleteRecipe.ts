import { supabase } from "../../../../lib/supabase";

export async function deleteRecipe(id: string): Promise<void> {
  await supabase.from("recipes").delete().eq("id", id);
}
