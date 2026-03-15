import { supabase } from "../../../../lib/supabase";

export async function signUp(email: string, password: string, displayName: string): Promise<{ error?: string }> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) return { error: error.message };
  return {};
}
