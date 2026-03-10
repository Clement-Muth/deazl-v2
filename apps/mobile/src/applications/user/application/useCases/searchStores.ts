import { supabase } from "../../../../lib/supabase";

export interface StoreResult {
  id: string;
  name: string;
  brand: string | null;
  city: string;
  address: string | null;
}

export async function searchStores(query: string): Promise<StoreResult[]> {
  if (!query.trim()) return [];
  const { data } = await supabase
    .from("stores")
    .select("id, name, brand, city, address")
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%,city.ilike.%${query}%`)
    .limit(20);
  return (data ?? []) as StoreResult[];
}
