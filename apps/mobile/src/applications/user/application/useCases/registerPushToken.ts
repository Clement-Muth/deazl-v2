import { Platform } from "react-native";
import { supabase } from "../../../../lib/supabase";

export async function registerPushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("push_tokens")
    .upsert(
      { user_id: user.id, token, platform: Platform.OS },
      { onConflict: "user_id,platform" }
    );
}
