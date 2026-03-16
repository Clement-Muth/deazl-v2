import { supabase } from "../../../../lib/supabase";
import type { PantryItem, StorageLocation } from "../../domain/entities/pantry";

export async function getPantryItems(): Promise<PantryItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let query = supabase
    .from("pantry_items")
    .select("id, custom_name, quantity, unit, expiry_date, location, created_at")
    .order("expiry_date", { ascending: true, nullsFirst: false });

  if (membership?.household_id) {
    const { data: members } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", membership.household_id);
    const userIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
    query = query.in("user_id", userIds);
  } else {
    query = query.eq("user_id", user.id);
  }

  const { data } = await query;

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
