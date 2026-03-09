"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function clearCheckedItems(listId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("shopping_items")
    .delete()
    .eq("shopping_list_id", listId)
    .eq("is_checked", true);
  revalidatePath("/shopping");
}
