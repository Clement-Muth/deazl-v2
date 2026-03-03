"use server";

import { searchOFF } from "@/applications/catalog/infrastructure/openFoodFacts";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";

export async function searchProducts(query: string): Promise<OFFProduct[]> {
  if (!query.trim() || query.trim().length < 2) return [];
  return searchOFF(query.trim());
}
