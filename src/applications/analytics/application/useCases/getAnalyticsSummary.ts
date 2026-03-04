"use server";

import { createClient } from "@/lib/supabase/server";
import type { AnalyticsSummary, ListStat, CategoryStat } from "@/applications/analytics/domain/entities/analytics";

export async function getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: lists } = await supabase
    .from("shopping_lists")
    .select("id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  if (!lists?.length) {
    return { totalLists: 0, totalItemsChecked: 0, avgCompletionRate: 0, recentLists: [], categoryBreakdown: [] };
  }

  const listIds = lists.map((l) => l.id);

  const { data: items } = await supabase
    .from("shopping_items")
    .select("shopping_list_id, is_checked, category")
    .in("shopping_list_id", listIds);

  const itemsByList = new Map<string, { total: number; checked: number }>();
  for (const list of lists) {
    itemsByList.set(list.id, { total: 0, checked: 0 });
  }

  const categoryCounts = new Map<string, number>();

  for (const item of items ?? []) {
    const entry = itemsByList.get(item.shopping_list_id);
    if (entry) {
      entry.total++;
      if (item.is_checked) entry.checked++;
    }
    const cat = item.category ?? "Autre";
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
  }

  const recentLists: ListStat[] = lists.map((l) => {
    const stats = itemsByList.get(l.id)!;
    return { id: l.id, createdAt: l.created_at, totalItems: stats.total, checkedItems: stats.checked };
  });

  const totalItemsChecked = recentLists.reduce((s, l) => s + l.checkedItems, 0);
  const totalItems = recentLists.reduce((s, l) => s + l.totalItems, 0);
  const avgCompletionRate = totalItems > 0 ? Math.round((totalItemsChecked / totalItems) * 100) : 0;

  const categoryBreakdown: CategoryStat[] = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalLists: lists.length,
    totalItemsChecked,
    avgCompletionRate,
    recentLists,
    categoryBreakdown,
  };
}
