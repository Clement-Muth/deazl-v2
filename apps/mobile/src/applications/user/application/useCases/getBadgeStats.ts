import { supabase } from "../../../../lib/supabase";
import { getStreak } from "../../../planning/application/useCases/getStreak";

export interface BadgeStats {
  totalSessions: number;
  sessionsThisMonth: number;
  monthlyGoal: number;
  fullWeeksCount: number;
  currentStreak: number;
  shoppingListsCompleted: number;
  unlockedKeys: string[];
  unlockedDates: Record<string, string>;
}

export async function getBadgeStats(): Promise<BadgeStats> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      totalSessions: 0,
      sessionsThisMonth: 0,
      monthlyGoal: 4,
      fullWeeksCount: 0,
      currentStreak: 0,
      shoppingListsCompleted: 0,
      unlockedKeys: [],
      unlockedDates: {},
    };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const [sessionsRes, unlockedRes, plansRes, shoppingRes, streak] = await Promise.all([
    supabase.from("batch_cooking_sessions").select("week_start, created_at").eq("user_id", user.id),
    supabase.from("user_badges").select("badge_key, unlocked_at").eq("user_id", user.id),
    supabase.from("meal_plans").select("id").eq("user_id", user.id),
    supabase.from("shopping_lists").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
    getStreak(),
  ]);

  const sessions = sessionsRes.data ?? [];
  const totalSessions = sessions.length;
  const sessionsThisMonth = sessions.filter((s) => s.created_at.slice(0, 10) >= monthStart).length;

  const unlockedRows = unlockedRes.data ?? [];
  const unlockedKeys = unlockedRows.map((b) => b.badge_key);
  const unlockedDates: Record<string, string> = {};
  for (const row of unlockedRows) {
    unlockedDates[row.badge_key] = row.unlocked_at;
  }

  const shoppingListsCompleted = shoppingRes.count ?? 0;

  const planIds = (plansRes.data ?? []).map((p) => p.id);
  let fullWeeksCount = 0;
  if (planIds.length > 0) {
    const { data: slots } = await supabase
      .from("meal_slots")
      .select("meal_plan_id")
      .in("meal_plan_id", planIds)
      .not("recipe_id", "is", null);

    const counts = (slots ?? []).reduce<Record<string, number>>((acc, s) => {
      acc[s.meal_plan_id] = (acc[s.meal_plan_id] ?? 0) + 1;
      return acc;
    }, {});

    fullWeeksCount = Object.values(counts).filter((c) => c >= 21).length;
  }

  return {
    totalSessions,
    sessionsThisMonth,
    monthlyGoal: 4,
    fullWeeksCount,
    currentStreak: streak,
    shoppingListsCompleted,
    unlockedKeys,
    unlockedDates,
  };
}
