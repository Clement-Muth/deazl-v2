"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveDietaryPreferences(preferences: string[]): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.updateUser({ data: { dietary_preferences: preferences } });
  revalidatePath("/profile");
}
