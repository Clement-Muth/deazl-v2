const OFF_SEARCH_BASE = "https://search.openfoodfacts.org";
const FIELDS = "code,product_name,brands,nutriscore_grade,nova_group,image_thumb_url,nutriments,serving_quantity,allergens_tags,additives_tags";
const HEADERS = { "User-Agent": "Deazl/1.0 (contact@deazl.app)" };

export interface OFFProductResult {
  offId: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  nutriscoreGrade: string | null;
  novaGroup: number | null;
  energyKcal100g: number | null;
  proteins100g: number | null;
  carbohydrates100g: number | null;
  sugars100g: number | null;
  fat100g: number | null;
  saturatedFat100g: number | null;
  fiber100g: number | null;
  salt100g: number | null;
  servingQuantity: number | null;
  allergensTags: string[];
  additivesTags: string[];
}

function parseOFFProduct(p: Record<string, unknown>): Pick<OFFProductResult, "novaGroup" | "energyKcal100g" | "proteins100g" | "carbohydrates100g" | "sugars100g" | "fat100g" | "saturatedFat100g" | "fiber100g" | "salt100g" | "servingQuantity" | "allergensTags" | "additivesTags"> {
  const n = (p.nutriments ?? {}) as Record<string, unknown>;
  const kcal = n["energy-kcal_100g"] ?? (n["energy_100g"] != null ? Math.round(Number(n["energy_100g"]) / 4.184) : null);
  return {
    novaGroup: p.nova_group != null ? Number(p.nova_group) : null,
    energyKcal100g: kcal != null ? Number(kcal) : null,
    proteins100g: n["proteins_100g"] != null ? Number(n["proteins_100g"]) : null,
    carbohydrates100g: n["carbohydrates_100g"] != null ? Number(n["carbohydrates_100g"]) : null,
    sugars100g: n["sugars_100g"] != null ? Number(n["sugars_100g"]) : null,
    fat100g: n["fat_100g"] != null ? Number(n["fat_100g"]) : null,
    saturatedFat100g: n["saturated-fat_100g"] != null ? Number(n["saturated-fat_100g"]) : null,
    fiber100g: n["fiber_100g"] != null ? Number(n["fiber_100g"]) : null,
    salt100g: n["salt_100g"] != null ? Number(n["salt_100g"]) : null,
    servingQuantity: p.serving_quantity != null ? Number(p.serving_quantity) : null,
    allergensTags: Array.isArray(p.allergens_tags) ? p.allergens_tags as string[] : [],
    additivesTags: Array.isArray(p.additives_tags) ? p.additives_tags as string[] : [],
  };
}

export async function searchOffProducts(query: string): Promise<OFFProductResult[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const res = await fetch(
      `${OFF_SEARCH_BASE}/search?q=${encodeURIComponent(q)}&page_size=15&fields=${FIELDS}&json=1`,
      { headers: HEADERS },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits ?? [])
      .filter((p: Record<string, unknown>) => p.code && p.product_name)
      .map((p: Record<string, unknown>) => ({
        offId: String(p.code),
        name: String(p.product_name ?? ""),
        brand: typeof p.brands === "string" ? p.brands.split(",")[0].trim() || null : null,
        imageUrl: typeof p.image_thumb_url === "string" ? p.image_thumb_url || null : null,
        nutriscoreGrade: typeof p.nutriscore_grade === "string" ? p.nutriscore_grade.toLowerCase() || null : null,
        ...parseOFFProduct(p),
      }));
  } catch {
    return [];
  }
}

export async function getOffProductByBarcode(ean: string): Promise<OFFProductResult | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${ean}.json?fields=${FIELDS}`,
      { headers: HEADERS },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    return {
      offId: ean,
      name: p.product_name ?? "",
      brand: typeof p.brands === "string" ? p.brands.split(",")[0].trim() || null : null,
      imageUrl: p.image_thumb_url || null,
      nutriscoreGrade: p.nutriscore_grade?.toLowerCase() || null,
      ...parseOFFProduct(p),
    };
  } catch {
    return null;
  }
}
