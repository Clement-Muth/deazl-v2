"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();

    async function handle() {
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) { router.replace("/auth/email-confirmed"); return; }
      }

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "email_change" | "signup" | "recovery" });
        if (!error) { router.replace("/auth/email-confirmed"); return; }
      }

      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error) { router.replace("/auth/email-confirmed"); return; }
      }

      router.replace("/login?error=auth");
    }

    handle();
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 24, height: 24, border: "2px solid #E8571C", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
