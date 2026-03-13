import { supabase } from "../../../../lib/supabase";
import type { OSMStore } from "./searchStoresOSM";

export async function addUserStoreFromOSM(osmStore: OSMStore): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const delta = 0.0005;
  const { data: existing } = await supabase
    .from("stores")
    .select("id")
    .gte("latitude", osmStore.latitude - delta)
    .lte("latitude", osmStore.latitude + delta)
    .gte("longitude", osmStore.longitude - delta)
    .lte("longitude", osmStore.longitude + delta)
    .maybeSingle();

  let storeId: string;

  if (existing) {
    storeId = existing.id as string;
  } else {
    const { data, error } = await supabase
      .from("stores")
      .insert({
        name: osmStore.name,
        brand: osmStore.brand,
        city: osmStore.city,
        address: osmStore.address,
        postal_code: osmStore.postalCode,
        latitude: osmStore.latitude,
        longitude: osmStore.longitude,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "Erreur lors de la création du magasin" };
    storeId = (data as { id: string }).id;
  }

  await supabase
    .from("user_stores")
    .upsert({ user_id: user.id, store_id: storeId }, { onConflict: "user_id,store_id" });

  return {};
}
