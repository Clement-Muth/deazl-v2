import { supabase } from "../../../../lib/supabase";

function slotDate(weekStart: string, dayOfWeek: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + (dayOfWeek - 1));
  return d.toISOString().slice(0, 10);
}

export async function getStreak(): Promise<number> {
  const { data } = await supabase
    .from("meal_slots")
    .select("day_of_week, meal_plans(week_start)")
    .eq("is_done", true);

  if (!data || data.length === 0) return 0;

  const dates = new Set<string>();
  for (const row of data) {
    const plan = Array.isArray(row.meal_plans) ? row.meal_plans[0] : row.meal_plans;
    if (!plan?.week_start) continue;
    dates.add(slotDate(plan.week_start, row.day_of_week));
  }

  if (dates.size === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const sorted = [...dates].sort().reverse();

  if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) return 0;

  let streak = 0;
  const check = new Date(sorted[0] === todayStr ? today : yesterday);

  for (const dateStr of sorted) {
    if (dateStr === check.toISOString().slice(0, 10)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
