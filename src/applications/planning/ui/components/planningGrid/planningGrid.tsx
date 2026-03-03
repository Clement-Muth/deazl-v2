"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import { getWeekDays, formatDayHeader } from "@/applications/planning/lib/weekUtils";
import { setMealSlot } from "@/applications/planning/application/useCases/setMealSlot";
import { clearMealSlot } from "@/applications/planning/application/useCases/clearMealSlot";
import { DayStrip } from "./dayStrip";
import { MealSlotCell } from "./mealSlotCell";
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

function findTodayIndex(weekDays: Date[]): number {
  const today = new Date();
  return weekDays.findIndex(
    (d) =>
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
  );
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export function PlanningGrid({ initialPlan, recipes, locale }: PlanningGridProps) {
  const [plan, setPlan] = useState<MealPlanData>(initialPlan);
  const [pickerState, setPickerState] = useState<PickerState | null>(null);
  const [pendingSlot, setPendingSlot] = useState<PickerState | null>(null);
  const [, startTransition] = useTransition();

  const weekDays = getWeekDays(plan.weekStart);
  const todayIdx = findTodayIndex(weekDays);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() =>
    todayIdx >= 0 ? todayIdx : 0
  );

  const selectedDayOfWeek = selectedDayIndex + 1;
  const selectedDate = weekDays[selectedDayIndex];
  const { isToday } = formatDayHeader(selectedDate, locale);

  function getSlot(dayOfWeek: number, mealType: MealType): MealSlotData {
    return (
      plan.slots.find((s) => s.dayOfWeek === dayOfWeek && s.mealType === mealType) ?? {
        slotId: null,
        dayOfWeek,
        mealType,
        recipeId: null,
        recipeName: null,
        servings: 4,
      }
    );
  }

  const filledCounts = weekDays.map((_, i) =>
    MEAL_TYPES.filter((mt) => !!getSlot(i + 1, mt).recipeName).length
  );

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
            s.dayOfWeek === dayOfWeek && s.mealType === mealType ? { ...s, slotId } : s
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

  const TodayButton = todayIdx >= 0 ? (
    <button
      type="button"
      onClick={() => setSelectedDayIndex(todayIdx)}
      className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-primary/30 transition active:scale-[0.95]"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <Trans>Today</Trans>
    </button>
  ) : (
    <Link
      href="/planning"
      className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-primary/30 transition active:scale-[0.95]"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <Trans>Today</Trans>
    </Link>
  );

  return (
    <>
      <DayStrip
        weekDays={weekDays}
        locale={locale}
        selectedIndex={selectedDayIndex}
        filledCounts={filledCounts}
        onSelect={setSelectedDayIndex}
      />

      <div className="flex items-end justify-between px-5 pb-5">
        <div>
          <h2 className="text-3xl font-black leading-none tracking-tight text-foreground">
            {selectedDate.toLocaleDateString(locale, { weekday: "long" }).replace(/^\w/, (c) => c.toUpperCase())}
          </h2>
          <p className={`mt-1.5 text-sm font-medium ${isToday ? "text-primary" : "text-gray-400"}`}>
            {selectedDate.toLocaleDateString(locale, { day: "numeric", month: "long" })}
          </p>
        </div>
        {!isToday && TodayButton}
      </div>

      <div key={selectedDayIndex} className="flex animate-fade-in flex-col gap-3 px-4 pb-4">
        {MEAL_TYPES.map((mt) => (
          <div key={mt} className="overflow-hidden rounded-2xl bg-white/80 shadow-sm backdrop-blur-sm ring-1 ring-black/5">
            <MealSlotCell
              slot={getSlot(selectedDayOfWeek, mt)}
              onTap={() => handleSlotTap(selectedDayOfWeek, mt)}
              isPending={
                pendingSlot?.dayOfWeek === selectedDayOfWeek && pendingSlot?.mealType === mt
              }
            />
          </div>
        ))}
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
