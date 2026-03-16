import { supabase } from "../../../../lib/supabase";
import type { RecipeIngredient } from "../../domain/entities/recipe";

export type QualityLevel = "excellent" | "bon" | "surveiller" | "mauvais";

export interface UltraProcessedIngredient {
  name: string;
  novaGroup: 3 | 4;
}

export interface RecipeQuality {
  level: QualityLevel;
  allergens: string[];
  ultraProcessed: UltraProcessedIngredient[];
  additives: string[];
  coveredCount: number;
  totalCount: number;
}

const OFF_HEADERS = { "User-Agent": "Deazl/1.0 (contact@deazl.app)" };

interface ProductQuality {
  id: string;
  off_id: string | null;
  nova_group: number | null;
  allergens_tags: string[] | null;
  additives_tags: string[] | null;
  serving_quantity: number | null;
}

async function fetchQualityFromOff(offId: string): Promise<Pick<ProductQuality, "nova_group" | "allergens_tags" | "additives_tags"> | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${offId}.json?fields=nova_group,allergens_tags,additives_tags`,
      { headers: OFF_HEADERS },
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;
    return {
      nova_group: p.nova_group != null ? Number(p.nova_group) : null,
      allergens_tags: Array.isArray(p.allergens_tags) ? p.allergens_tags : [],
      additives_tags: Array.isArray(p.additives_tags) ? p.additives_tags : [],
    };
  } catch {
    return null;
  }
}

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

function novaScore(novaGroup: number | null): number {
  if (novaGroup === 1) return 100;
  if (novaGroup === 2) return 75;
  if (novaGroup === 3) return 40;
  if (novaGroup === 4) return 10;
  return 85;
}

function levelFromScore(score: number): QualityLevel {
  if (score >= 75) return "excellent";
  if (score >= 50) return "bon";
  if (score >= 25) return "surveiller";
  return "mauvais";
}

export async function getRecipeQuality(ingredients: RecipeIngredient[]): Promise<RecipeQuality | null> {
  const linkedIngredients = ingredients.filter((i) => i.productId);
  if (linkedIngredients.length === 0) return null;

  const productIds = [...new Set(linkedIngredients.map((i) => i.productId!))];

  const { data: products } = await supabase
    .from("products")
    .select("id, off_id, nova_group, allergens_tags, additives_tags, serving_quantity")
    .in("id", productIds);

  if (!products) return null;

  const productMap = new Map<string, ProductQuality>(products.map((p: ProductQuality) => [p.id, p]));

  const missingWithOffId = products.filter(
    (p: ProductQuality) => p.off_id && p.allergens_tags == null,
  );

  if (missingWithOffId.length > 0) {
    const fetched = await Promise.all(
      missingWithOffId.map(async (p: ProductQuality) => {
        const data = await fetchQualityFromOff(p.off_id!);
        return { productId: p.id, data };
      }),
    );
    for (const { productId, data } of fetched) {
      if (!data) continue;
      const existing = productMap.get(productId);
      if (existing) productMap.set(productId, { ...existing, ...data });
      supabase.from("products").update(data).eq("id", productId).then(() => {});
    }
  }

  const allAllergens = new Set<string>();
  const allAdditives = new Set<string>();
  const ultraProcessed: UltraProcessedIngredient[] = [];
  let coveredCount = 0;

  let weightedScoreSum = 0;
  let totalWeight = 0;

  for (const ing of linkedIngredients) {
    const product = productMap.get(ing.productId!);
    if (!product) continue;
    coveredCount++;

    for (const tag of product.allergens_tags ?? []) allAllergens.add(tag);
    for (const tag of product.additives_tags ?? []) allAdditives.add(tag);

    if (product.nova_group === 3 || product.nova_group === 4) {
      ultraProcessed.push({
        name: ing.customName ?? ing.productName ?? "",
        novaGroup: product.nova_group as 3 | 4,
      });
    }

    const grams = toGrams(ing.quantity, ing.unit ?? "", product.serving_quantity) ?? 50;
    const additivePenalty = Math.min((product.additives_tags?.length ?? 0) * 3, 30);
    const score = Math.max(0, novaScore(product.nova_group) - additivePenalty);
    weightedScoreSum += score * grams;
    totalWeight += grams;
  }

  if (coveredCount === 0) return null;

  const avgScore = totalWeight > 0 ? weightedScoreSum / totalWeight : 85;

  return {
    level: levelFromScore(avgScore),
    allergens: [...allAllergens],
    ultraProcessed,
    additives: [...allAdditives],
    coveredCount,
    totalCount: ingredients.length,
  };
}
