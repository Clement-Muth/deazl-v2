"use server";

import { createClient } from "@/lib/supabase/server";

export async function clearMealSlot(slotId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("meal_slots").delete().eq("id", slotId);
}
