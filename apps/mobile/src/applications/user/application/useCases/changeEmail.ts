import { supabase } from "../../../../lib/supabase";

export async function changeEmail(newEmail: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) return { error: error.message };
  return {};
}
