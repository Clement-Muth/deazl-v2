"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function transferCheckedToPantry(
  items: { name: string; quantity: number | null; unit: string | null }[],
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (items.length === 0) return {};

  const { error } = await supabase.from("pantry_items").insert(
    items.map((item) => ({
      user_id: user.id,
      custom_name: item.name.trim(),
      quantity: item.quantity,
      unit: item.unit,
      location: "pantry",
      expiry_date: null,
    })),
  );

  if (error) return { error: error.message };

  revalidatePath("/pantry");
  revalidatePath("/shopping");
  return {};
}
