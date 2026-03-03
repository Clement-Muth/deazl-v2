"use server";

import { createClient } from "@/lib/supabase/server";
import { getOFFProductFull } from "@/applications/catalog/infrastructure/openFoodFacts";
import type { OFFProductFull } from "@/applications/catalog/domain/entities/catalog";
import { projectUpdate } from "next/dist/build/swc/generated-native";

export interface ProductPrice {
  price: number;
  quantity: number;
  unit: string;
  storeName: string;
  storeBrand: string | null;
}

export interface ProductDetails {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  nutriscoreGrade: string | null;
  ecoscoreGrade: string | null;
  novaGroup: number | null;
  prices: ProductPrice[];
  off: OFFProductFull | null;
}

export async function getProductDetails(productId: string): Promise<ProductDetails | null> {
  const supabase = await createClient();

  const [{ data: product }, { data: prices }] = await Promise.all([
    supabase
      .from("products")
      .select("id, off_id, name, brand, image_url, nutriscore_grade, ecoscore_grade, nova_group")
      .eq("id", productId)
      .single(),
    supabase
      .from("latest_prices")
      .select("price, quantity, unit, store_name, store_brand")
      .eq("product_id", productId)
      .order("price", { ascending: true }),
  ]);

  if (!product) return null;

  const off = product.off_id ? await getOFFProductFull(product.off_id) : null;
  
  
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    imageUrl: off?.imageUrl ?? product.image_url,
    nutriscoreGrade: product.nutriscore_grade,
    ecoscoreGrade: product.ecoscore_grade,
    novaGroup: product.nova_group,
    prices: (prices ?? []).map((p) => ({
      price: p.price,
      quantity: p.quantity,
      unit: p.unit,
      storeName: p.store_name,
      storeBrand: p.store_brand,
    })),
    off,
  };
}
