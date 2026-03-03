"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function removeUserStore(storeId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("user_stores").delete().eq("user_id", user.id).eq("store_id", storeId);
  revalidatePath("/profile");
}
