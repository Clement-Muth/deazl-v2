import { supabase } from "../../../../lib/supabase";
import type { StorageLocation } from "../../domain/entities/pantry";

export interface AddPantryItemInput {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  expiryDate?: string | null;
  location: StorageLocation;
}

export async function addPantryItem(input: AddPantryItemInput): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("pantry_items").insert({
    user_id: user.id,
    custom_name: input.name.trim(),
    quantity: input.quantity ?? null,
    unit: input.unit ?? null,
    expiry_date: input.expiryDate ?? null,
    location: input.location,
  });

  if (error) return { error: error.message };
  return {};
}
