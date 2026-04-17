import { supabase } from "../../../../lib/supabase";

export async function saveOnboardingFrequency(frequency: number): Promise<void> {
  await supabase.auth.updateUser({ data: { batch_cooking_frequency: frequency } });
}
