"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StorageLocation } from "@/applications/pantry/domain/entities/pantry";

export async function addPantryItem(
  _prevState: { error: string } | undefined,
  formData: FormData,
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Le nom est requis" };

  const quantity = formData.get("quantity") as string;
  const unit = (formData.get("unit") as string)?.trim() || null;
  const expiryDate = (formData.get("expiry_date") as string) || null;
  const location = (formData.get("location") as StorageLocation) ?? "pantry";

  const { error } = await supabase.from("pantry_items").insert({
    user_id: user.id,
    custom_name: name,
    quantity: quantity ? parseFloat(quantity.replace(",", ".")) : null,
    unit: unit || null,
    expiry_date: expiryDate || null,
    location,
  });

  if (error) return { error: error.message };

  revalidatePath("/pantry");
}
