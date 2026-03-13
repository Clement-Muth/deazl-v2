import * as WebBrowser from "expo-web-browser";
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

  const result = await WebBrowser.openAuthSessionAsync(data.url, "deazl://auth/callback");
  if (result.type !== "success") return {};

  const code = new URLSearchParams(result.url.split("?")[1] ?? "").get("code");
  if (!code) return { error: "Code de connexion manquant" };

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
  if (sessionError) return { error: sessionError.message };
  return {};
}
