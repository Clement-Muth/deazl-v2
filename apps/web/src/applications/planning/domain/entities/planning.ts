export type MealType = "breakfast" | "lunch" | "dinner";

export interface MealSlotData {
  slotId: string | null;
  dayOfWeek: number;
  mealType: MealType;
  recipeId: string | null;
  recipeName: string | null;
  servings: number;
}

export interface MealPlanData {
  id: string;
  weekStart: Date;
  slots: MealSlotData[];
}
