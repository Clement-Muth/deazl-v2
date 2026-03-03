import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";

const OFF_BASE = "https://world.openfoodfacts.org";
const FIELDS = "code,product_name,brands,nutriscore_grade,ecoscore_grade,nova_group,image_thumb_url,categories_tags";

interface OFFRawProduct {
  code: string;
  product_name?: string;
  brands?: string;
  nutriscore_grade?: string;
  ecoscore_grade?: string;
  nova_group?: number;
  image_thumb_url?: string;
  categories_tags?: string[];
}

function mapProduct(p: OFFRawProduct): OFFProduct {
  return {
    offId: p.code,
    name: p.product_name ?? "",
    brand: p.brands?.split(",")[0].trim() || null,
    category: p.categories_tags?.[0]?.replace(/^en:/, "") ?? null,
    imageUrl: p.image_thumb_url || null,
    nutriscoreGrade: p.nutriscore_grade?.toLowerCase() || null,
    ecoscoreGrade: p.ecoscore_grade?.toLowerCase() || null,
    novaGroup: p.nova_group ?? null,
  };
}

export async function searchOFF(query: string): Promise<OFFProduct[]> {
  const url = `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=15&fields=${FIELDS}&search_simple=1&action=process`;

  const res = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { "User-Agent": "Deazl/1.0 (contact@deazl.app)" },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data.products ?? [])
    .filter((p: OFFRawProduct) => p.code && p.product_name)
    .map(mapProduct);
}

export async function getOFFProduct(offId: string): Promise<OFFProduct | null> {
  const url = `${OFF_BASE}/api/v0/product/${offId}.json?fields=${FIELDS}`;

  const res = await fetch(url, {
    next: { revalidate: 86400 },
    headers: { "User-Agent": "Deazl/1.0 (contact@deazl.app)" },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;

  return mapProduct({ code: offId, ...data.product });
}
