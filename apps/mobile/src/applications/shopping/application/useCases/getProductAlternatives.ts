import { supabase } from "../../../../lib/supabase";

export interface AlternativeProduct {
  offId: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  nutriscoreGrade: string | null;
}

const NUTRISCORE_ORDER = ["a", "b", "c", "d", "e"];
const HEADERS = { "User-Agent": "Deazl/1.0 (contact@deazl.app)" };

export async function getProductAlternatives(productId: string): Promise<AlternativeProduct[]> {
  const { data: product } = await supabase
    .from("products")
    .select("off_id, nutriscore_grade")
    .eq("id", productId)
    .single();

  if (!product?.off_id) return [];

  try {
    const catRes = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${product.off_id}.json?fields=categories_tags`,
      { headers: HEADERS },
    );
    if (!catRes.ok) return [];
    const catData = await catRes.json();
    const categoriesTags: string[] = catData.product?.categories_tags ?? [];
    const category = categoriesTags.at(-1);
    if (!category) return [];

    const FIELDS = "code,product_name,brands,nutriscore_grade,image_thumb_url";
    const searchRes = await fetch(
      `https://world.openfoodfacts.org/api/v2/search?categories_tags=${encodeURIComponent(category)}&page_size=20&sort_by=nutriscore_score&fields=${FIELDS}`,
      { headers: HEADERS },
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();

    const currentGrade = product.nutriscore_grade?.toLowerCase() ?? null;
    const currentIdx = currentGrade ? NUTRISCORE_ORDER.indexOf(currentGrade) : NUTRISCORE_ORDER.length;

    return ((searchData.products ?? []) as Record<string, unknown>[])
      .filter((p) => p.code && p.product_name && p.code !== product.off_id)
      .map((p) => ({
        offId: String(p.code),
        name: String(p.product_name ?? ""),
        brand: typeof p.brands === "string" ? p.brands.split(",")[0].trim() || null : null,
        imageUrl: typeof p.image_thumb_url === "string" ? p.image_thumb_url || null : null,
        nutriscoreGrade: typeof p.nutriscore_grade === "string" ? p.nutriscore_grade.toLowerCase() || null : null,
      }))
      .filter((p) => {
        const idx = p.nutriscoreGrade ? NUTRISCORE_ORDER.indexOf(p.nutriscoreGrade) : NUTRISCORE_ORDER.length;
        return idx < currentIdx;
      })
      .slice(0, 4);
  } catch {
    return [];
  }
}
