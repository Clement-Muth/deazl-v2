"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";

export async function linkIngredient(
  ingredientId: string,
  product: OFFProduct,
  recipeId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: upserted } = await supabase
    .from("products")
    .upsert(
      {
        off_id: product.offId,
        name: product.name,
        brand: product.brand,
        category: product.category,
        image_url: product.imageUrl,
        nutriscore_grade: product.nutriscoreGrade,
        ecoscore_grade: product.ecoscoreGrade,
        nova_group: product.novaGroup,
        unit: "pièce",
      },
      { onConflict: "off_id" },
    )
    .select("id")
    .single();

  if (!upserted) return;

  await supabase
    .from("recipe_ingredients")
    .update({ product_id: upserted.id })
    .eq("id", ingredientId);

  revalidatePath(`/recipes/${recipeId}`);
}
