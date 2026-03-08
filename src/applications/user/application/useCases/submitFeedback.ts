"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitFeedback(message: string, pageUrl: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    message: message.trim(),
    page_url: pageUrl,
  });

  if (error) return { error: "Impossible d'envoyer le feedback" };
  return {};
}
