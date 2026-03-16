import { supabase } from "../../../../lib/supabase";
import type { RecipeIngredient } from "../../domain/entities/recipe";

export interface RecipeNutrition {
  energyKcal: number;
  proteins: number;
  carbohydrates: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  salt: number;
  coveredCount: number;
  totalCount: number;
}

interface ProductNutrition {
  id: string;
  off_id: string | null;
  energy_kcal_100g: number | null;
  proteins_100g: number | null;
  carbohydrates_100g: number | null;
  sugars_100g: number | null;
  fat_100g: number | null;
  saturated_fat_100g: number | null;
  fiber_100g: number | null;
  salt_100g: number | null;
  serving_quantity: number | null;
}

const OFF_HEADERS = { "User-Agent": "Deazl/1.0 (contact@deazl.app)" };

function toGrams(quantity: number, unit: string, servingQuantity: number | null): number | null {
  if (quantity <= 0) return null;
  const u = unit.toLowerCase().trim();
  if (u === "g" || u === "ml") return quantity;
  if (u === "kg" || u === "l") return quantity * 1000;
  if (u === "cl") return quantity * 10;
  if (u === "c. à soupe" || u === "càs" || u === "cs" || u === "tbsp") return quantity * 15;
  if (u === "c. à café" || u === "càc" || u === "cc" || u === "tsp") return quantity * 5;
  if (u === "tasse" || u === "cup") return quantity * 240;
  if (u === "pincée") return quantity * 0.5;
  if (servingQuantity != null && servingQuantity > 0) return quantity * servingQuantity;
  return null;
}

async function fetchNutritionFromOff(offId: string): Promise<Omit<ProductNutrition, "id" | "off_id"> | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${offId}.json?fields=nutriments,serving_quantity`,
      { headers: OFF_HEADERS },
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;
    const n = p.nutriments ?? {};
    const kcal = n["energy-kcal_100g"] ?? (n["energy_100g"] != null ? Math.round(n["energy_100g"] / 4.184) : null);
    return {
      energy_kcal_100g: kcal != null ? Number(kcal) : null,
      proteins_100g: n["proteins_100g"] != null ? Number(n["proteins_100g"]) : null,
      carbohydrates_100g: n["carbohydrates_100g"] != null ? Number(n["carbohydrates_100g"]) : null,
      sugars_100g: n["sugars_100g"] != null ? Number(n["sugars_100g"]) : null,
      fat_100g: n["fat_100g"] != null ? Number(n["fat_100g"]) : null,
      saturated_fat_100g: n["saturated-fat_100g"] != null ? Number(n["saturated-fat_100g"]) : null,
      fiber_100g: n["fiber_100g"] != null ? Number(n["fiber_100g"]) : null,
      salt_100g: n["salt_100g"] != null ? Number(n["salt_100g"]) : null,
      serving_quantity: p.serving_quantity != null ? Number(p.serving_quantity) : null,
    };
  } catch {
    return null;
  }
}

export async function getRecipeNutrition(
  ingredients: RecipeIngredient[],
  baseServings: number,
): Promise<RecipeNutrition | null> {
  const linkedIngredients = ingredients.filter((i) => i.productId);
  if (linkedIngredients.length === 0) return null;

  const productIds = [...new Set(linkedIngredients.map((i) => i.productId!))];

  const { data: products } = await supabase
    .from("products")
    .select("id, off_id, energy_kcal_100g, proteins_100g, carbohydrates_100g, sugars_100g, fat_100g, saturated_fat_100g, fiber_100g, salt_100g, serving_quantity")
    .in("id", productIds);

  if (!products) return null;

  const productMap = new Map<string, ProductNutrition>(products.map((p: ProductNutrition) => [p.id, p]));

  const missingWithOffId = products.filter(
    (p: ProductNutrition) => p.off_id && p.energy_kcal_100g == null,
  );

  if (missingWithOffId.length > 0) {
    const fetched = await Promise.all(
      missingWithOffId.map(async (p: ProductNutrition) => {
        const data = await fetchNutritionFromOff(p.off_id!);
        return { productId: p.id, data };
      }),
    );

    for (const { productId, data } of fetched) {
      if (!data) continue;
      const existing = productMap.get(productId);
      if (existing) {
        productMap.set(productId, { ...existing, ...data });
      }
      supabase
        .from("products")
        .update(data)
        .eq("id", productId)
        .then(() => {});
    }
  }

  let totalKcal = 0;
  let totalProteins = 0;
  let totalCarbs = 0;
  let totalSugars = 0;
  let totalFat = 0;
  let totalSaturatedFat = 0;
  let totalFiber = 0;
  let totalSalt = 0;
  let coveredCount = 0;

  for (const ing of ingredients) {
    if (!ing.productId) continue;
    const product = productMap.get(ing.productId);
    if (!product || product.energy_kcal_100g == null) continue;
    const grams = toGrams(ing.quantity, ing.unit ?? "", product.serving_quantity);
    if (grams == null) continue;
    const factor = grams / 100;
    totalKcal += product.energy_kcal_100g * factor;
    totalProteins += (product.proteins_100g ?? 0) * factor;
    totalCarbs += (product.carbohydrates_100g ?? 0) * factor;
    totalSugars += (product.sugars_100g ?? 0) * factor;
    totalFat += (product.fat_100g ?? 0) * factor;
    totalSaturatedFat += (product.saturated_fat_100g ?? 0) * factor;
    totalFiber += (product.fiber_100g ?? 0) * factor;
    totalSalt += (product.salt_100g ?? 0) * factor;
    coveredCount++;
  }

  if (coveredCount === 0) return null;

  const perServing = baseServings > 0 ? baseServings : 1;
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return {
    energyKcal: Math.round(totalKcal / perServing),
    proteins: round1(totalProteins / perServing),
    carbohydrates: round1(totalCarbs / perServing),
    sugars: round1(totalSugars / perServing),
    fat: round1(totalFat / perServing),
    saturatedFat: round1(totalSaturatedFat / perServing),
    fiber: round1(totalFiber / perServing),
    salt: round1(totalSalt / perServing),
    coveredCount,
    totalCount: ingredients.length,
  };
}
