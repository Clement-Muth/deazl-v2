import { supabase } from "../../../../lib/supabase";

export async function updateHouseholdSize(size: number): Promise<void> {
  await supabase.auth.updateUser({ data: { household_size: size } });
}
