"use server";

import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";

const FIELDS = "code,product_name,brands,nutriscore_grade,ecoscore_grade,nova_group,image_thumb_url";
const NUTRISCORE_ORDER = ["a", "b", "c", "d", "e"];
const HEADERS = { "User-Agent": "Deazl/1.0 (contact@deazl.app)" };
const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, options: RequestInit & { next?: { revalidate?: number } }): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function getAlternativesByOffId(offId: string, currentNutriscore: string | null): Promise<OFFProduct[]> {
  const currentIdx = currentNutriscore
    ? NUTRISCORE_ORDER.indexOf(currentNutriscore.toLowerCase())
    : NUTRISCORE_ORDER.length;

  if (currentIdx <= 1) return [];

  let catRes: Response;
  try {
    catRes = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v0/product/${offId}.json?fields=categories_tags`,
      { next: { revalidate: 86400 }, headers: HEADERS },
    );
  } catch { return []; }
  if (!catRes.ok) return [];
  const catData = await catRes.json();
  const category = (catData.product?.categories_tags as string[] | undefined)?.at(-1);
  if (!category) return [];

  let searchRes: Response;
  try {
    searchRes = await fetchWithTimeout(
      `https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&tagtype_0=categories&tag_contains_0=contains&tag_0=${encodeURIComponent(category)}&page_size=10&sort_by=nutriscore_score&fields=${FIELDS}`,
      { next: { revalidate: 3600 }, headers: HEADERS },
    );
  } catch { return []; }
  if (!searchRes.ok) return [];
  const searchData = await searchRes.json();

  return ((searchData.products ?? []) as Record<string, unknown>[])
    .filter((p) => p.code && p.product_name && p.code !== offId)
    .map((p) => ({
      offId: String(p.code),
      name: String(p.product_name ?? ""),
      brand: typeof p.brands === "string" ? p.brands.split(",")[0].trim() || null : null,
      category: null,
      imageUrl: typeof p.image_thumb_url === "string" ? p.image_thumb_url || null : null,
      nutriscoreGrade: typeof p.nutriscore_grade === "string" ? p.nutriscore_grade.toLowerCase() || null : null,
      ecoscoreGrade: typeof p.ecoscore_grade === "string" ? p.ecoscore_grade.toLowerCase() || null : null,
      novaGroup: typeof p.nova_group === "number" ? p.nova_group : null,
    }))
    .filter((p) => {
      const idx = p.nutriscoreGrade ? NUTRISCORE_ORDER.indexOf(p.nutriscoreGrade) : NUTRISCORE_ORDER.length;
      return idx < currentIdx;
    })
    .slice(0, 3);
}
