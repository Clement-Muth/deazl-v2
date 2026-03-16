import { supabase } from "../../../../lib/supabase";
import type { OFFProductResult } from "./searchOffProducts";

export async function findOrCreateProduct(product: OFFProductResult): Promise<string | null> {
  const { data, error } = await supabase
    .from("products")
    .upsert(
      {
        off_id: product.offId,
        name: product.name,
        brand: product.brand,
        image_url: product.imageUrl,
        nutriscore_grade: product.nutriscoreGrade,
        nova_group: product.novaGroup,
        energy_kcal_100g: product.energyKcal100g,
        proteins_100g: product.proteins100g,
        carbohydrates_100g: product.carbohydrates100g,
        sugars_100g: product.sugars100g,
        fat_100g: product.fat100g,
        saturated_fat_100g: product.saturatedFat100g,
        fiber_100g: product.fiber100g,
        salt_100g: product.salt100g,
        serving_quantity: product.servingQuantity,
        allergens_tags: product.allergensTags,
        additives_tags: product.additivesTags,
      },
      { onConflict: "off_id" },
    )
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}
