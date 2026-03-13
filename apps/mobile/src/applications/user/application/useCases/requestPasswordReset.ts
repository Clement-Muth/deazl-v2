import { supabase } from "../../../../lib/supabase";

export async function requestPasswordReset(email: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "deazl://reset-password",
  });
  if (error) return { error: error.message };
  return {};
}
