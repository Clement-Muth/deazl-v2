import { supabase } from "../../../../lib/supabase";
import type { CookingSession } from "../types/cookingSession";

function getMondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function generateCookingSession(recipeIds: string[]): Promise<CookingSession> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  const accessToken = session.access_token;

  const week_start = getMondayOf(new Date());
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(`${supabaseUrl}/functions/v1/generate-cooking-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
      "apikey": anonKey,
    },
    body: JSON.stringify({ recipe_ids: recipeIds, week_start }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Edge Function error ${res.status}: ${body}`);
  }

  const { session_data } = await res.json() as { session_data: CookingSession };
  return session_data;
}
