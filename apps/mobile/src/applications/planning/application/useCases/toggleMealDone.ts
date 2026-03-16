import { supabase } from "../../../../lib/supabase";

export async function toggleMealDone(slotId: string, isDone: boolean): Promise<void> {
  await supabase.from("meal_slots").update({ is_done: isDone }).eq("id", slotId);
}
