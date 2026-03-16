import { supabase } from "../../../../lib/supabase";

export interface CookLog {
  count: number;
  lastCookedAt: Date | null;
}

export async function getCookLog(recipeId: string): Promise<CookLog> {
  const { data } = await supabase
    .from("meal_slots")
    .select("day_of_week, meal_plans(week_start)")
    .eq("recipe_id", recipeId)
    .eq("is_done", true);

  if (!data || data.length === 0) return { count: 0, lastCookedAt: null };

  const dates = data
    .map((row) => {
      const plan = Array.isArray(row.meal_plans) ? row.meal_plans[0] : row.meal_plans;
      if (!plan?.week_start) return null;
      const d = new Date(plan.week_start);
      d.setDate(d.getDate() + (row.day_of_week - 1));
      return d;
    })
    .filter((d): d is Date => d !== null)
    .sort((a, b) => b.getTime() - a.getTime());

  return { count: dates.length, lastCookedAt: dates[0] ?? null };
}
