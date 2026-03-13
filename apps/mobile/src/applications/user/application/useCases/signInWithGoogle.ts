import * as Linking from "expo-linking";
import { supabase } from "../../../../lib/supabase";

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "deazl://auth/callback",
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) return { error: error?.message ?? "Impossible d'ouvrir Google" };
  await Linking.openURL(data.url);
  return {};
}
