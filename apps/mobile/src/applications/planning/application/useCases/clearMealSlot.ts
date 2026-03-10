import { supabase } from "../../../../lib/supabase";

export async function clearMealSlot(slotId: string): Promise<void> {
  await supabase.from("meal_slots").delete().eq("id", slotId);
}
