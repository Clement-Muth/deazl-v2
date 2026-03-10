import { supabase } from "../../../../lib/supabase";

export async function saveDietaryPreferences(preferences: string[]): Promise<void> {
  await supabase.auth.updateUser({ data: { dietary_preferences: preferences } });
}
