import { createClient } from "@/lib/supabase/server";
import { formatWeekParam } from "@/applications/planning/lib/weekUtils";
import type { MealPlanData, MealSlotData, MealType } from "@/applications/planning/domain/entities/planning";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export async function getMealPlan(weekStart: Date): Promise<MealPlanData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const weekParam = formatWeekParam(weekStart);

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const householdId = membership?.household_id ?? null;

  let planId: string;

  if (householdId) {
    const { data: householdPlan } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("household_id", householdId)
      .eq("week_start", weekParam)
      .maybeSingle();

    if (householdPlan) {
      planId = householdPlan.id;
    } else {
      const { data: personalPlan } = await supabase
        .from("meal_plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_start", weekParam)
        .maybeSingle();

      if (personalPlan) {
        await supabase
          .from("meal_plans")
          .update({ household_id: householdId })
          .eq("id", personalPlan.id);
        planId = personalPlan.id;
      } else {
        const { data: newPlan, error } = await supabase
          .from("meal_plans")
          .insert({ user_id: user.id, week_start: weekParam, household_id: householdId })
          .select("id")
          .single();
        if (error || !newPlan) throw new Error(error?.message ?? "Failed to create meal plan");
        planId = newPlan.id;
      }
    }
  } else {
    const { data: personalPlan } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("user_id", user.id)
      .is("household_id", null)
      .eq("week_start", weekParam)
      .maybeSingle();

    if (personalPlan) {
      planId = personalPlan.id;
    } else {
      const { data: newPlan, error } = await supabase
        .from("meal_plans")
        .insert({ user_id: user.id, week_start: weekParam })
        .select("id")
        .single();
      if (error || !newPlan) throw new Error(error?.message ?? "Failed to create meal plan");
      planId = newPlan.id;
    }
  }

  const { data: rawSlots } = await supabase
    .from("meal_slots")
    .select("id, day_of_week, meal_type, recipe_id, servings, recipes(name)")
    .eq("meal_plan_id", planId);

  const filledSlots: MealSlotData[] = [];
  for (let day = 1; day <= 7; day++) {
    for (const mealType of MEAL_TYPES) {
      const existing = rawSlots?.find(
        (s) => s.day_of_week === day && s.meal_type === mealType
      );
      if (existing) {
        filledSlots.push({
          slotId: existing.id,
          dayOfWeek: existing.day_of_week,
          mealType: existing.meal_type as MealType,
          recipeId: existing.recipe_id,
          recipeName: (Array.isArray(existing.recipes)
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

  return { id: planId, weekStart, slots: filledSlots };
}
