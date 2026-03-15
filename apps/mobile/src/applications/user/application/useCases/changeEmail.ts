import { supabase } from "../../../../lib/supabase";

export async function changeEmail(newEmail: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.updateUser(
    { email: newEmail },
    { emailRedirectTo: "deazl://auth/callback" }
  );
  if (error) return { error: error.message };
  return {};
}
