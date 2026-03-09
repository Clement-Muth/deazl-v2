"use server";

import { createClient } from "@/lib/supabase/server";
import type { MealType } from "@/applications/planning/domain/entities/planning";

export async function setMealSlot(
  mealPlanId: string,
  dayOfWeek: number,
  mealType: MealType,
  recipeId: string
): Promise<{ slotId: string }> {
  const supabase = await createClient();

  await supabase
    .from("meal_slots")
    .delete()
    .eq("meal_plan_id", mealPlanId)
    .eq("day_of_week", dayOfWeek)
    .eq("meal_type", mealType);

  const { data, error } = await supabase
    .from("meal_slots")
    .insert({
      meal_plan_id: mealPlanId,
      day_of_week: dayOfWeek,
      meal_type: mealType,
      recipe_id: recipeId,
      servings: 4,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to set meal slot");
  return { slotId: data.id };
}
