"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleRecipePublic(recipeId: string): Promise<{ isPublic: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isPublic: false };

  const { data: recipe } = await supabase
    .from("recipes")
    .select("is_public")
    .eq("id", recipeId)
    .eq("user_id", user.id)
    .single();

  if (!recipe) return { isPublic: false };

  const newPublic = !recipe.is_public;
  await supabase
    .from("recipes")
    .update({ is_public: newPublic })
    .eq("id", recipeId)
    .eq("user_id", user.id);

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
  return { isPublic: newPublic };
}
