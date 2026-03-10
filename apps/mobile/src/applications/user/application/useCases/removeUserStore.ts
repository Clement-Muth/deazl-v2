import { supabase } from "../../../../lib/supabase";

export async function removeUserStore(storeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_stores")
    .delete()
    .eq("user_id", user.id)
    .eq("store_id", storeId);
}
