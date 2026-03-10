import { supabase } from "../../../../lib/supabase";

export async function signUp(email: string, password: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  return {};
}
