const OFF_SEARCH_BASE = "https://search.openfoodfacts.org";
const FIELDS = "code,product_name,brands,nutriscore_grade,image_thumb_url";
const HEADERS = { "User-Agent": "Deazl/1.0 (contact@deazl.app)" };

export interface OFFProductResult {
  offId: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  nutriscoreGrade: string | null;
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
    };
  } catch {
    return null;
  }
}
