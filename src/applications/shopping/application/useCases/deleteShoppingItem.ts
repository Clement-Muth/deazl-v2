"use server";

import { createClient } from "@/lib/supabase/server";

export async function deleteShoppingItem(itemId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("shopping_items").delete().eq("id", itemId);
}
