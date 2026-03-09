"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavorite(recipeId: string): Promise<{ isFavorite: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isFavorite: false };

  const { data: existing } = await supabase
    .from("recipe_favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId)
    .maybeSingle();

  if (existing) {
    await supabase.from("recipe_favorites").delete().eq("id", existing.id);
    revalidatePath("/recipes");
    return { isFavorite: false };
  }

  await supabase.from("recipe_favorites").insert({ user_id: user.id, recipe_id: recipeId });
  revalidatePath("/recipes");
  return { isFavorite: true };
}
