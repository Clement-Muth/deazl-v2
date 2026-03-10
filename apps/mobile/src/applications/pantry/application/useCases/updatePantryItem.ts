import { supabase } from "../../../../lib/supabase";
import type { StorageLocation } from "../../domain/entities/pantry";

export async function updatePantryItem(
  id: string,
  fields: { name: string; quantity: number | null; unit: string | null; location: StorageLocation; expiryDate: string | null },
): Promise<void> {
  await supabase.from("pantry_items").update({
    custom_name: fields.name,
    quantity: fields.quantity,
    unit: fields.unit,
    location: fields.location,
    expiry_date: fields.expiryDate,
  }).eq("id", id);
}
