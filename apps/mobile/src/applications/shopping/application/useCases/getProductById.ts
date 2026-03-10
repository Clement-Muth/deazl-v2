import { supabase } from "../../../../lib/supabase";

const OFF_HEADERS = { "User-Agent": "Deazl/1.0 (contact@deazl.app)" };
const OFF_FULL_FIELDS = "code,product_name,brands,nutriscore_grade,ecoscore_grade,nova_group,image_front_url,additives_tags,ingredients_text,allergens_tags,nutriments";

export interface OFFNutriments {
  energyKcal: number | null;
  fat: number | null;
  saturatedFat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  fiber: number | null;
  proteins: number | null;
  salt: number | null;
}

export interface ProductDetails {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  nutriscoreGrade: string | null;
  ecoscoreGrade: string | null;
  novaGroup: number | null;
  offId: string | null;
  ingredientsText: string | null;
  allergenTags: string[];
  additiveTags: string[];
  nutriments: OFFNutriments | null;
}

export async function getProductById(productId: string): Promise<ProductDetails | null> {
  const { data } = await supabase
    .from("products")
    .select("id, off_id, name, brand, image_url, nutriscore_grade, ecoscore_grade, nova_group")
    .eq("id", productId)
    .single();

  if (!data) return null;

  let ingredientsText: string | null = null;
  let allergenTags: string[] = [];
  let additiveTags: string[] = [];
  let nutriments: OFFNutriments | null = null;
  let imageUrl: string | null = data.image_url;

  if (data.off_id) {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${data.off_id}.json?fields=${OFF_FULL_FIELDS}`,
        { headers: OFF_HEADERS },
      );
      if (res.ok) {
        const json = await res.json();
        if (json.status === 1 && json.product) {
          const p = json.product;
          imageUrl = p.image_front_url || data.image_url;
          ingredientsText = p.ingredients_text || null;
          allergenTags = p.allergens_tags ?? [];
          additiveTags = p.additives_tags ?? [];
          const n = p.nutriments ?? {};
          nutriments = {
            energyKcal: n["energy-kcal_100g"] ?? (n["energy_100g"] != null ? Math.round(n["energy_100g"] / 4.184) : null),
            fat: n["fat_100g"] ?? null,
            saturatedFat: n["saturated-fat_100g"] ?? null,
            carbohydrates: n["carbohydrates_100g"] ?? null,
            sugars: n["sugars_100g"] ?? null,
            fiber: n["fiber_100g"] ?? null,
            proteins: n["proteins_100g"] ?? null,
            salt: n["salt_100g"] ?? null,
          };
        }
      }
    } catch {}
  }

  return {
    id: data.id,
    name: data.name,
    brand: data.brand,
    imageUrl,
    nutriscoreGrade: data.nutriscore_grade,
    ecoscoreGrade: data.ecoscore_grade,
    novaGroup: data.nova_group,
    offId: data.off_id,
    ingredientsText,
    allergenTags,
    additiveTags,
    nutriments,
  };
}
