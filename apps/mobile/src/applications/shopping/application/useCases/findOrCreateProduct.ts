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
      },
      { onConflict: "off_id" },
    )
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id;
}
