"use client";

import { useState, useTransition } from "react";
import { getWeekDays, formatDayHeader } from "@/applications/planning/lib/weekUtils";
import { setMealSlot } from "@/applications/planning/application/useCases/setMealSlot";
import { clearMealSlot } from "@/applications/planning/application/useCases/clearMealSlot";
import { DayCard } from "./dayCard";
import { RecipePicker } from "./recipePicker";
import type { MealPlanData, MealSlotData, MealType } from "@/applications/planning/domain/entities/planning";

interface Recipe {
  id: string;
  name: string;
}

interface PlanningGridProps {
  initialPlan: MealPlanData;
  recipes: Recipe[];
  locale: string;
}

interface PickerState {
  dayOfWeek: number;
  mealType: MealType;
}

export function PlanningGrid({ initialPlan, recipes, locale }: PlanningGridProps) {
  const [plan, setPlan] = useState<MealPlanData>(initialPlan);
  const [pickerState, setPickerState] = useState<PickerState | null>(null);
  const [pendingSlot, setPendingSlot] = useState<PickerState | null>(null);
  const [, startTransition] = useTransition();

  const weekDays = getWeekDays(plan.weekStart);

  function getSlot(dayOfWeek: number, mealType: MealType): MealSlotData {
    return plan.slots.find(
      (s) => s.dayOfWeek === dayOfWeek && s.mealType === mealType
    ) ?? { slotId: null, dayOfWeek, mealType, recipeId: null, recipeName: null, servings: 4 };
  }

  function handleSlotTap(dayOfWeek: number, mealType: MealType) {
    setPickerState({ dayOfWeek, mealType });
  }

  function handleSelectRecipe(recipeId: string) {
    if (!pickerState) return;
    const { dayOfWeek, mealType } = pickerState;
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    setPickerState(null);
    setPendingSlot({ dayOfWeek, mealType });

    setPlan((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.dayOfWeek === dayOfWeek && s.mealType === mealType
          ? { ...s, recipeId, recipeName: recipe.name }
          : s
      ),
    }));

    startTransition(async () => {
      try {
        const { slotId } = await setMealSlot(plan.id, dayOfWeek, mealType, recipeId);
        setPlan((prev) => ({
          ...prev,
          slots: prev.slots.map((s) =>
            s.dayOfWeek === dayOfWeek && s.mealType === mealType
              ? { ...s, slotId }
              : s
          ),
        }));
      } finally {
        setPendingSlot(null);
      }
    });
  }

  function handleClearSlot() {
    if (!pickerState) return;
    const { dayOfWeek, mealType } = pickerState;
    const slot = getSlot(dayOfWeek, mealType);

    setPickerState(null);
    if (!slot.slotId) return;

    setPendingSlot({ dayOfWeek, mealType });

    setPlan((prev) => ({
      ...prev,
      slots: prev.slots.map((s) =>
        s.dayOfWeek === dayOfWeek && s.mealType === mealType
          ? { ...s, slotId: null, recipeId: null, recipeName: null }
          : s
      ),
    }));

    const slotId = slot.slotId;
    startTransition(async () => {
      try {
        await clearMealSlot(slotId);
      } finally {
        setPendingSlot(null);
      }
    });
  }

  const activeSlot = pickerState ? getSlot(pickerState.dayOfWeek, pickerState.mealType) : null;

  return (
    <>
      <div className="flex flex-col gap-3 px-4 pb-4">
        {weekDays.map((date, i) => {
          const dayOfWeek = i + 1;
          const { name, num, isToday } = formatDayHeader(date, locale);
          const daySlots = (["breakfast", "lunch", "dinner"] as MealType[]).map((mt) =>
            getSlot(dayOfWeek, mt)
          );
          return (
            <DayCard
              key={dayOfWeek}
              dayName={name}
              dayNum={num}
              isToday={isToday}
              slots={daySlots}
              pendingSlot={pendingSlot}
              onSlotTap={handleSlotTap}
            />
          );
        })}
      </div>

      {pickerState && (
        <RecipePicker
          recipes={recipes}
          hasExisting={!!activeSlot?.recipeId}
          onSelect={handleSelectRecipe}
          onClear={handleClearSlot}
          onClose={() => setPickerState(null)}
        />
      )}
    </>
  );
}
