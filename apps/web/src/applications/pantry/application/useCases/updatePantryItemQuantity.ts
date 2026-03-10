"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updatePantryItemQuantity(itemId: string, quantity: number | null): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("pantry_items")
    .update({ quantity })
    .eq("id", itemId)
    .eq("user_id", user.id);

  revalidatePath("/pantry");
}
