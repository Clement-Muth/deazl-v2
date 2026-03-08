"use server";

import type { OSMStoreResult } from "./searchOSMStores";

export async function getNearbyStores(lat: number, lon: number, radiusMeters = 2000): Promise<OSMStoreResult[]> {
  const query = `[out:json][timeout:10];
(
  node["shop"~"supermarket|convenience|grocery|wholesale"](around:${radiusMeters},${lat},${lon});
  way["shop"~"supermarket|convenience|grocery|wholesale"](around:${radiusMeters},${lat},${lon});
);
out center body;`;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data: {
      elements: {
        type: string;
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }[];
    } = await res.json();

    const results: OSMStoreResult[] = [];

    for (const el of data.elements) {
      const tags = el.tags ?? {};
      const name = tags.name || tags.brand;
      if (!name) continue;

      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (!elLat || !elLon) continue;

      const city = tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || "";
      if (!city) continue;

      const houseNo = tags["addr:housenumber"] ? `${tags["addr:housenumber"]} ` : "";
      const street = tags["addr:street"] || "";
      const address = `${houseNo}${street}`.trim();
      const postcode = tags["addr:postcode"] || "";
      const brand = tags.brand || name;
      const displayAddress = [address, postcode, city].filter(Boolean).join(" ").trim();

      results.push({
        osmKey: `${el.type}/${el.id}`,
        name,
        brand,
        displayAddress,
        city,
        address,
        postcode,
        lat: elLat,
        lon: elLon,
      });
    }

    const seen = new Set<string>();
    return results.filter((r) => {
      const key = `${r.name}|${r.city}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch {
    return [];
  }
}
