"use server";

export interface OSMStoreResult {
  osmKey: string;
  name: string;
  brand: string;
  displayAddress: string;
  city: string;
  address: string;
  postcode: string;
  lat: number;
  lon: number;
}

export async function searchOSMStores(query: string): Promise<OSMStoreResult[]> {
  if (query.trim().length < 2) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "12");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("countrycodes", "fr");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Deazl/1.0 (https://deazl.fr)",
        "Accept-Language": "fr",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const data: {
      osm_type: string;
      osm_id: number;
      class: string;
      type: string;
      name?: string;
      display_name: string;
      lat: string;
      lon: string;
      address: Record<string, string>;
      extratags?: Record<string, string>;
    }[] = await res.json();

    const results: OSMStoreResult[] = [];

    for (const item of data) {
      const name = item.name || item.display_name.split(",")[0].trim();
      if (!name) continue;

      const isShop =
        item.class === "shop" ||
        item.type === "supermarket" ||
        item.type === "convenience" ||
        item.type === "wholesale" ||
        !!item.extratags?.shop ||
        !!item.extratags?.brand;

      if (!isShop) continue;

      const addr = item.address;
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.county ||
        "";
      if (!city) continue;

      const houseNo = addr.house_number ? `${addr.house_number} ` : "";
      const street = addr.road || addr.pedestrian || "";
      const address = `${houseNo}${street}`.trim();
      const postcode = addr.postcode || "";
      const brand = item.extratags?.brand || name;

      const displayAddress = [address, postcode, city].filter(Boolean).join(" ").trim();

      results.push({
        osmKey: `${item.osm_type}/${item.osm_id}`,
        name,
        brand,
        displayAddress,
        city,
        address,
        postcode,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      });
    }

    return results;
  } catch {
    return [];
  }
}
