import { supabase } from "../../../../lib/supabase";

export async function updateDisplayName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.auth.updateUser({ data: { full_name: trimmed } });
  await supabase.from("profiles").update({ display_name: trimmed }).eq("id", user.id);
}
