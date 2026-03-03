"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleShoppingItem(itemId: string, isChecked: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("shopping_items").update({ is_checked: isChecked }).eq("id", itemId);
}
