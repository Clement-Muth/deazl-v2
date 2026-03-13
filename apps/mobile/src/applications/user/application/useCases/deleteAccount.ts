import { supabase } from "../../../../lib/supabase";

export async function deleteAccount(): Promise<{ error?: string }> {
  const { error } = await supabase.rpc("delete_account");
  if (error) return { error: error.message };
  await supabase.auth.signOut();
  return {};
}
