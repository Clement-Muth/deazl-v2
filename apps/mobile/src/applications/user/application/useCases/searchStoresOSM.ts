const SHOP_TYPES = "supermarket|convenience|grocery|bakery|butcher|greengrocer|deli|general";
const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export interface OSMStore {
  osmId: string;
  name: string;
  brand: string | null;
  city: string;
  postalCode: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceM?: number;
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseElement(el: Record<string, unknown>, cityFallback = "", userLat?: number, userLng?: number): OSMStore | null {
  const tags = (el.tags ?? {}) as Record<string, string>;
  const name = tags.name;
  if (!name) return null;

  const lat = el.type === "node" ? (el.lat as number) : (el.center as Record<string, number>)?.lat;
  const lng = el.type === "node" ? (el.lon as number) : (el.center as Record<string, number>)?.lon;
  if (lat == null || lng == null) return null;

  const city = tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"] ?? cityFallback;
  const postalCode = tags["addr:postcode"] ?? null;
  const street = tags["addr:street"];
  const housenumber = tags["addr:housenumber"];
  const address = street ? `${housenumber ? housenumber + " " : ""}${street}` : null;
  const rawBrand = tags.brand ?? null;
  const brand = rawBrand && rawBrand !== name ? rawBrand : null;

  return {
    osmId: `${el.type}_${el.id}`,
    name,
    brand,
    city,
    postalCode,
    address,
    latitude: lat,
    longitude: lng,
    distanceM: userLat != null && userLng != null ? Math.round(haversineM(userLat, userLng, lat, lng)) : undefined,
  };
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; postalCode: string | null }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { "Accept-Language": "fr", "User-Agent": "Deazl/1.0" }, signal: controller.signal },
    );
    clearTimeout(timer);
    if (!res.ok) return { city: "", postalCode: null };
    const json = (await res.json()) as { address?: Record<string, string> };
    const addr = json.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? "";
    const postalCode = addr.postcode ?? null;
    return { city, postalCode };
  } catch {
    return { city: "", postalCode: null };
  }
}


const PHOTON_URL = "https://photon.komoot.io/api/";
const PHOTON_FRANCE_BBOX = "-5.5,41.3,9.6,51.5";

export async function searchStoresOSMByText(query: string): Promise<OSMStore[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const params = new URLSearchParams({
      q: query,
      limit: "15",
      lang: "fr",
      bbox: PHOTON_FRANCE_BBOX,
      osm_tag: "shop",
    });
    const res = await fetch(`${PHOTON_URL}?${params}`, {
      headers: { "Accept-Language": "fr", "User-Agent": "Deazl/1.0" },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      features: Array<{
        geometry: { coordinates: [number, number] };
        properties: {
          osm_id: number;
          osm_type: string;
          name?: string;
          city?: string;
          district?: string;
          postcode?: string;
          street?: string;
          housenumber?: string;
        };
      }>;
    };
    return (json.features ?? [])
      .filter((f) => f.properties.name)
      .map((f) => {
        const p = f.properties;
        const [lng, lat] = f.geometry.coordinates;
        const address = p.street ? `${p.housenumber ? p.housenumber + " " : ""}${p.street}` : null;
        return {
          osmId: `${(p.osm_type ?? "N").toLowerCase()}_${p.osm_id}`,
          name: p.name!,
          brand: null,
          city: p.city ?? p.district ?? "",
          postalCode: p.postcode ?? null,
          address,
          latitude: lat,
          longitude: lng,
        };
      });
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function searchStoresOSMNearby(lat: number, lng: number, radiusM = 2000): Promise<{ results: OSMStore[]; error?: string }> {
  const q = `[out:json][timeout:7];
(
  node["shop"~"${SHOP_TYPES}"](around:${radiusM},${lat},${lng});
  way["shop"~"${SHOP_TYPES}"](around:${radiusM},${lat},${lng});
);
out center 20;`;
  const body = `data=${encodeURIComponent(q)}`;
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };

  const [geo] = await Promise.allSettled([reverseGeocode(lat, lng)]);
  const { city: cityFallback } = geo.status === "fulfilled" ? geo.value : { city: "" };

  for (const url of OVERPASS_SERVERS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await fetch(url, { method: "POST", headers, body, signal: controller.signal });
      if (!res.ok) continue;
      const json = (await res.json()) as { elements: Record<string, unknown>[] };
      const results = (json.elements ?? [])
        .map((el) => parseElement(el, cityFallback, lat, lng))
        .filter((s): s is OSMStore => s !== null)
        .map((s) => ({ ...s, distanceM: Math.round(haversineM(lat, lng, s.latitude, s.longitude)) }))
        .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0));
      if (results.length === 0) return { results: [], error: "Aucun magasin trouvé dans un rayon de 2 km" };
      return { results };
    } catch {
      continue;
    } finally {
      clearTimeout(timer);
    }
  }
  return { results: [], error: "Service de carte indisponible, réessaie dans un moment" };
}
