"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addPantryItemFromScan(
  name: string,
  quantity: number | null,
  unit: string | null,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("pantry_items").insert({
    user_id: user.id,
    custom_name: name,
    quantity,
    unit: unit || null,
    location: "pantry",
  });

  if (error) return { error: error.message };

  revalidatePath("/pantry");
  return {};
}
