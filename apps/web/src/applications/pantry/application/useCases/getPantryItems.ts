"use server";

import { createClient } from "@/lib/supabase/server";
import type { PantryItem, StorageLocation } from "@/applications/pantry/domain/entities/pantry";

export async function getPantryItems(): Promise<PantryItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("pantry_items")
    .select("id, custom_name, quantity, unit, expiry_date, location, created_at")
    .eq("user_id", user.id)
    .order("expiry_date", { ascending: true, nullsFirst: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    customName: row.custom_name ?? "",
    quantity: row.quantity ? Number(row.quantity) : null,
    unit: row.unit ?? null,
    expiryDate: row.expiry_date ?? null,
    location: row.location as StorageLocation,
    createdAt: row.created_at,
  }));
}
