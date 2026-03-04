"use server";

import { createClient } from "@/lib/supabase/server";
import type { OSMStoreResult } from "./searchOSMStores";

export interface CreatedStore {
  id: string;
  name: string;
  brand: string;
  city: string;
}

export async function createStoreFromOSM(
  osm: OSMStoreResult,
): Promise<CreatedStore | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const { data: existing } = await supabase
    .from("stores")
    .select("id, name, brand, city")
    .eq("name", osm.name)
    .eq("city", osm.city)
    .maybeSingle();

  if (existing) return existing as CreatedStore;

  const { data, error } = await supabase
    .from("stores")
    .insert({
      name: osm.name,
      brand: osm.brand,
      city: osm.city,
      address: osm.address || null,
      postal_code: osm.postcode || null,
      latitude: isNaN(osm.lat) ? null : osm.lat,
      longitude: isNaN(osm.lon) ? null : osm.lon,
      created_by: user.id,
    })
    .select("id, name, brand, city")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create store" };
  return data as CreatedStore;
}

export async function createStoreManual(
  brand: string,
  city: string,
  address?: string,
): Promise<CreatedStore | { error: string }> {
  const supabase = await createClient();
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
