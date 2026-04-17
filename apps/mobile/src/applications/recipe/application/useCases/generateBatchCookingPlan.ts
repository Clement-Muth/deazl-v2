import { supabase } from "../../../../lib/supabase";
import { generateShoppingListFromPlan } from "../../../planning/application/useCases/generateShoppingListFromPlan";

export interface BatchCookingSelection {
  recipeId: string;
  portions: number;
}

export async function generateBatchCookingPlan(
  selections: BatchCookingSelection[],
  servings: number
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
  monday.setHours(0, 0, 0, 0);
  const weekParam = monday.toISOString().slice(0, 10);

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let mealPlanId: string;

  const { data: existingPlan } = await supabase
    .from("meal_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start", weekParam)
    .maybeSingle();

  if (existingPlan) {
    mealPlanId = existingPlan.id;
    await supabase
      .from("meal_slots")
      .delete()
      .eq("meal_plan_id", mealPlanId)
      .in("meal_type", ["lunch", "dinner"]);
  } else {
    const { data: newPlan, error } = await supabase
      .from("meal_plans")
      .insert({
        user_id: user.id,
        household_id: membership?.household_id ?? null,
        week_start: weekParam,
      })
      .select("id")
      .single();
    if (error || !newPlan) throw new Error("Failed to create meal plan");
    mealPlanId = newPlan.id;
  }

  const slots: { meal_plan_id: string; day_of_week: number; meal_type: string; recipe_id: string; servings: number }[] = [];

  const schedule: { dayOfWeek: number; mealType: "lunch" | "dinner" }[] = [];
  for (let d = 1; d <= 7; d++) {
    schedule.push({ dayOfWeek: d, mealType: "lunch" });
    schedule.push({ dayOfWeek: d, mealType: "dinner" });
  }

  let slotIndex = 0;
  for (const { recipeId, portions } of selections) {
    for (let p = 0; p < portions && slotIndex < schedule.length; p++, slotIndex++) {
      const { dayOfWeek, mealType } = schedule[slotIndex];
      slots.push({
        meal_plan_id: mealPlanId,
        day_of_week: dayOfWeek,
        meal_type: mealType,
        recipe_id: recipeId,
        servings,
      });
    }
  }

  if (slots.length > 0) {
    await supabase.from("meal_slots").insert(slots);
  }

  await generateShoppingListFromPlan();
}
