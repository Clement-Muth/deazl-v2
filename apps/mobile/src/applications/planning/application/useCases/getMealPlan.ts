import { supabase } from "../../../../lib/supabase";
import type { MealPlanData, MealSlotData, MealType } from "../../domain/entities/planning";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekParam(monday: Date): string {
  return monday.toISOString().slice(0, 10);
}

export async function getMealPlan(weekStart: Date): Promise<MealPlanData> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const weekParam = formatWeekParam(getMondayOf(weekStart));

  const { data: existingPlan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start", weekParam)
    .maybeSingle();

  let planId: string;

  if (existingPlan) {
    planId = existingPlan.id;
  } else {
    const { data: newPlan, error } = await supabase
      .from("meal_plans")
      .insert({ user_id: user.id, week_start: weekParam })
      .select("id")
      .single();
    if (error || !newPlan) throw new Error(error?.message ?? "Failed to create meal plan");
    planId = newPlan.id;
  }

  type RawSlot = {
    id: string;
    day_of_week: number;
    meal_type: string;
    recipe_id: string | null;
    servings: number;
    recipes: { name: string } | { name: string }[] | null;
  };

  const { data: rawSlots } = await supabase
    .from("meal_slots")
    .select("id, day_of_week, meal_type, recipe_id, servings, recipes(name)")
    .eq("meal_plan_id", planId);

  const slots = (rawSlots ?? []) as RawSlot[];

  const filledSlots: MealSlotData[] = [];
  for (let day = 1; day <= 7; day++) {
    for (const mealType of MEAL_TYPES) {
      const existing = slots.find(
        (s) => s.day_of_week === day && s.meal_type === mealType
      );
      if (existing) {
        filledSlots.push({
          slotId: existing.id,
          dayOfWeek: existing.day_of_week,
          mealType: existing.meal_type as MealType,
          recipeId: existing.recipe_id,
          recipeName:
            (Array.isArray(existing.recipes)
              ? (existing.recipes[0] as { name: string } | undefined)?.name
              : (existing.recipes as { name: string } | null)?.name) ?? null,
          servings: existing.servings,
        });
      } else {
        filledSlots.push({
          slotId: null,
          dayOfWeek: day,
          mealType,
          recipeId: null,
          recipeName: null,
          servings: 4,
        });
      }
    }
  }

  return { id: planId, weekStart: getMondayOf(weekStart), slots: filledSlots };
}
