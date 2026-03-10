import { supabase } from "../../../../lib/supabase";
import type { CatalogProduct } from "../../domain/entities/recipe";

export async function searchProducts(query: string): Promise<CatalogProduct[]> {
  const q = query.trim();
  if (!q) return [];

  const { data } = await supabase
    .from("products")
    .select("id, name, brand, image_url")
    .ilike("name", `%${q}%`)
    .limit(30);

  return (data ?? []).map((p: { id: string; name: string; brand: string | null; image_url: string | null }) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    imageUrl: p.image_url,
  }));
}
