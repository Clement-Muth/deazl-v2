"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDisplayName(name: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  await supabase.auth.updateUser({ data: { full_name: trimmed } });
  await supabase.from("profiles").update({ display_name: trimmed }).eq("id", user.id);
  revalidatePath("/profile");
}
