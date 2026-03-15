import { supabase } from "../../../../lib/supabase";

export async function resendConfirmationEmail(email: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) return { error: error.message };
  return {};
}
