"use server";

import { getOFFProduct } from "@/applications/catalog/infrastructure/openFoodFacts";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";

export async function getProductByBarcode(ean: string): Promise<OFFProduct | null> {
  if (!ean.trim()) return null;
  return getOFFProduct(ean.trim());
}
