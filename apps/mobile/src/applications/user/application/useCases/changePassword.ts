import { supabase } from "../../../../lib/supabase";

export async function changePassword(newPassword: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return {};
}
