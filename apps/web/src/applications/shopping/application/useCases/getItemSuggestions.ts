"use server";

import { createClient } from "@/lib/supabase/server";

export async function getItemSuggestions(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: lists } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("user_id", user.id);

  const listIds = (lists ?? []).map((l) => l.id);
  if (listIds.length === 0) return [];

  const { data } = await supabase
    .from("shopping_items")
    .select("custom_name")
    .in("shopping_list_id", listIds)
    .order("created_at", { ascending: false })
    .limit(400);

  if (!data) return [];

  const seen = new Set<string>();
  const result: string[] = [];
  for (const row of data) {
    if (!seen.has(row.custom_name)) {
      seen.add(row.custom_name);
      result.push(row.custom_name);
    }
  }
  return result;
}
