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

export async function getSessionForWeek(): Promise<CookingSession | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const week_start = getMondayOf(new Date());

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let query = supabase
    .from("batch_cooking_sessions")
    .select("session_data")
    .eq("week_start", week_start);

  if (membership?.household_id) {
    query = query.eq("household_id", membership.household_id);
  } else {
    query = query.eq("user_id", user.id).is("household_id", null);
  }

  const { data } = await query.maybeSingle();

  return (data?.session_data as CookingSession) ?? null;
}
