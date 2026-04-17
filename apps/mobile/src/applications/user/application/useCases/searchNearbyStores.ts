import { supabase } from "../../../../lib/supabase";
import type { StoreResult } from "./searchStores";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function searchNearbyStores(lat: number, lng: number, radiusKm = 10): Promise<StoreResult[]> {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  const { data } = await supabase
    .from("stores")
    .select("id, name, brand, city, address, latitude, longitude")
    .gte("latitude", lat - latDelta)
    .lte("latitude", lat + latDelta)
    .gte("longitude", lng - lngDelta)
    .lte("longitude", lng + lngDelta)
    .limit(30);

  if (!data) return [];

  return (data as (StoreResult & { latitude: number; longitude: number })[])
    .filter((s) => haversineKm(lat, lng, s.latitude, s.longitude) <= radiusKm)
    .sort((a, b) => haversineKm(lat, lng, a.latitude, a.longitude) - haversineKm(lat, lng, b.latitude, b.longitude))
    .slice(0, 10);
}
