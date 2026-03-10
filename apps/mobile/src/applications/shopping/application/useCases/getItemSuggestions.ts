import { supabase } from "../../../../lib/supabase";

export async function getItemSuggestions(): Promise<string[]> {
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

  function norm(s: string) {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  const seenNorm = new Set<string>();
  const result: string[] = [];
  for (const row of data) {
    const key = norm(row.custom_name);
    if (key && !seenNorm.has(key)) {
      seenNorm.add(key);
      result.push(row.custom_name);
    }
  }
  return result;
}
