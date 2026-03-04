"use server";

import { searchOFF } from "@/applications/catalog/infrastructure/openFoodFacts";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";

export async function searchProductsForPricing(query: string): Promise<OFFProduct[]> {
  if (query.trim().length < 2) return [];
  return searchOFF(query);
}
