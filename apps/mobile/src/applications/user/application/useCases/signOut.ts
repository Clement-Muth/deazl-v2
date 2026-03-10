import { supabase } from "../../../../lib/supabase";

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
