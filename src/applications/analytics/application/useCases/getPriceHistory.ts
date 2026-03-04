"use server";

import { createClient } from "@/lib/supabase/server";
import type { IngredientPriceHistory, StoreComparison } from "@/applications/analytics/domain/entities/analytics";

export async function getPriceHistory(): Promise<{
  ingredients: IngredientPriceHistory[];
  storeComparisons: StoreComparison[];
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ingredients: [], storeComparisons: [] };

  const { data: rows } = await supabase
    .from("ingredient_prices")
    .select("ingredient_name, price, quantity, unit, reported_at, store_id, stores(name, brand, city)")
    .eq("reported_by", user.id)
    .order("reported_at", { ascending: true })
    .limit(200);

  if (!rows?.length) return { ingredients: [], storeComparisons: [] };

  const byIngredient = new Map<string, IngredientPriceHistory>();
  const byStore = new Map<string, { storeName: string; storeBrand: string | null; storeCity: string | null; prices: number[]; count: number }>();

  for (const row of rows) {
    const store = Array.isArray(row.stores) ? row.stores[0] as { name: string; brand: string | null; city: string | null } | undefined : row.stores as { name: string; brand: string | null; city: string | null } | null;
    const storeName = store?.name ?? "Inconnu";
    const date = row.reported_at.slice(0, 10);

    if (!byIngredient.has(row.ingredient_name)) {
      byIngredient.set(row.ingredient_name, { ingredientName: row.ingredient_name, points: [] });
    }
    byIngredient.get(row.ingredient_name)!.points.push({
      date,
      price: Number(row.price),
      storeName,
      unit: row.unit,
      quantity: Number(row.quantity),
    });

    if (!byStore.has(row.store_id)) {
      byStore.set(row.store_id, { storeName, storeBrand: store?.brand ?? null, storeCity: store?.city ?? null, prices: [], count: 0 });
    }
    const storeEntry = byStore.get(row.store_id)!;
    storeEntry.count++;
    const pricePerKg = row.unit === "kg" ? Number(row.price) / Number(row.quantity) : null;
    if (pricePerKg !== null) storeEntry.prices.push(pricePerKg);
  }

  const ingredients = Array.from(byIngredient.values())
    .filter((i) => i.points.length >= 2)
    .sort((a, b) => b.points.length - a.points.length)
    .slice(0, 5);

  const storeComparisons: StoreComparison[] = Array.from(byStore.values())
    .map((s) => ({
      storeName: s.storeName,
      storeBrand: s.storeBrand,
      storeCity: s.storeCity,
      reportCount: s.count,
      avgPricePerKg: s.prices.length > 0 ? s.prices.reduce((a, b) => a + b, 0) / s.prices.length : null,
    }))
    .sort((a, b) => b.reportCount - a.reportCount);

  return { ingredients, storeComparisons };
}
