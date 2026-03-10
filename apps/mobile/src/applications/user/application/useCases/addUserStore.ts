import { supabase } from "../../../../lib/supabase";

export async function addUserStore(storeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_stores")
    .upsert({ user_id: user.id, store_id: storeId }, { onConflict: "user_id,store_id" });
}
