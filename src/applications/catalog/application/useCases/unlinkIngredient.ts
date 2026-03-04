"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function unlinkIngredient(ingredientId: string, recipeId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("recipe_ingredients")
    .update({ product_id: null })
    .eq("id", ingredientId);

  revalidatePath(`/recipes/${recipeId}`);
}
