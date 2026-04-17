import { supabase } from "../../../../lib/supabase";

export async function saveOnboardingGoal(goal: string): Promise<void> {
  await supabase.auth.updateUser({ data: { batch_cooking_goal: goal } });
}
