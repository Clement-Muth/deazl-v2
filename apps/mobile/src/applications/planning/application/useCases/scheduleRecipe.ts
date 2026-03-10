import type { MealType } from "../../domain/entities/planning";
import { getMealPlan } from "./getMealPlan";
import { setMealSlot } from "./setMealSlot";

export async function scheduleRecipe(recipeId: string, dayOfWeek: number, mealType: MealType): Promise<void> {
  const monday = (() => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const plan = await getMealPlan(monday);
  await setMealSlot(plan.id, dayOfWeek, mealType, recipeId);
}
