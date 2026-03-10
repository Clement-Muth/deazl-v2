"use server";

import { createClient } from "@/lib/supabase/server";

export interface StoreResult {
  id: string;
  name: string;
  brand: string;
  city: string;
  address: string | null;
}

export async function searchStores(query: string): Promise<StoreResult[]> {
  if (query.trim().length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("id, name, brand, city, address")
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%,city.ilike.%${query}%`)
    .order("name")
    .limit(15);
  return data ?? [];
}
