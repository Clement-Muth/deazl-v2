import { supabase } from "../../../../lib/supabase";

export interface CreatedStore {
  id: string;
  name: string;
  brand: string | null;
  city: string;
}

export async function createStoreManual(
  brand: string,
  city: string,
  address?: string,
): Promise<CreatedStore | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const name = address ? `${brand} — ${address}, ${city}` : `${brand} ${city}`;

  const { data: existing } = await supabase
    .from("stores")
    .select("id, name, brand, city")
    .eq("name", name)
    .eq("city", city)
    .maybeSingle();

  if (existing) return existing as CreatedStore;

  const { data, error } = await supabase
    .from("stores")
    .insert({ brand, name, city, address: address || null, created_by: user.id })
    .select("id, name, brand, city")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create store" };
  return data as CreatedStore;
}
