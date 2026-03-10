import { supabase } from "../../../../lib/supabase";

export async function completeOnboarding(): Promise<void> {
  await supabase.auth.updateUser({ data: { onboarding_completed: true } });
}
