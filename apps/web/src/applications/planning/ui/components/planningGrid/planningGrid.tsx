"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import { createClient } from "@/lib/supabase/client";
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
  dietaryTags: string[];
  inPantry?: boolean;
}

interface PlanningGridProps {
  initialPlan: MealPlanData;
  recipes: Recipe[];
  userDietaryPreferences: string[];
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

const INITIAL_COLORS = [
  "bg-amber-100 text-amber-700",
  "bg-primary-light text-primary",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
}

export function PlanningGrid({ initialPlan, recipes, userDietaryPreferences, locale }: PlanningGridProps) {
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

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`meal_slots:${plan.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meal_slots", filter: `meal_plan_id=eq.${plan.id}` },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const s = payload.new as { id: string; day_of_week: number; meal_type: string; recipe_id: string | null; servings: number };
            const name = recipes.find((r) => r.id === s.recipe_id)?.name ?? null;
            setPlan((prev) => ({
              ...prev,
              slots: prev.slots.map((slot) =>
                slot.dayOfWeek === s.day_of_week && slot.mealType === (s.meal_type as MealType)
                  ? { ...slot, slotId: s.id, recipeId: s.recipe_id, recipeName: name, servings: s.servings }
                  : slot
              ),
            }));
          } else if (payload.eventType === "DELETE") {
            const s = payload.old as { day_of_week: number; meal_type: string };
            setPlan((prev) => ({
              ...prev,
              slots: prev.slots.map((slot) =>
                slot.dayOfWeek === s.day_of_week && slot.mealType === (s.meal_type as MealType)
                  ? { ...slot, slotId: null, recipeId: null, recipeName: null }
                  : slot
              ),
            }));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [plan.id, recipes]);

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

  function fillSlot(dayOfWeek: number, mealType: MealType, recipeId: string) {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

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

  function handleSlotTap(dayOfWeek: number, mealType: MealType) {
    setPickerState({ dayOfWeek, mealType });
  }

  function handleSelectRecipe(recipeId: string) {
    if (!pickerState) return;
    const { dayOfWeek, mealType } = pickerState;
    setPickerState(null);
    fillSlot(dayOfWeek, mealType, recipeId);
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

  function handleQuickAdd(recipeId: string) {
    const firstEmpty = MEAL_TYPES.find((mt) => !getSlot(selectedDayOfWeek, mt).recipeId);
    if (!firstEmpty) return;
    fillSlot(selectedDayOfWeek, firstEmpty, recipeId);
  }

  const quickRecipes = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    for (const slot of plan.slots) {
      if (!slot.recipeId || !slot.recipeName) continue;
      const e = counts.get(slot.recipeId);
      if (e) e.count++;
      else counts.set(slot.recipeId, { name: slot.recipeName, count: 1 });
    }
    if (counts.size > 0) {
      return [...counts.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id, { name }]) => ({ id, name }));
    }
    return recipes.slice(0, 5).map((r) => ({ id: r.id, name: r.name }));
  }, [plan.slots, recipes]);

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

  const totalFilled = filledCounts.reduce((a, b) => a + b, 0);
  const totalSlots = weekDays.length * MEAL_TYPES.length;

  const dayHasEmptySlot = MEAL_TYPES.some((mt) => !getSlot(selectedDayOfWeek, mt).recipeId);

  return (
    <>
      <DayStrip
        weekDays={weekDays}
        locale={locale}
        selectedIndex={selectedDayIndex}
        filledCounts={filledCounts}
        onSelect={setSelectedDayIndex}
      />

      {totalFilled > 0 && (
        <div className="mx-5 mb-2 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-black/8">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.round((totalFilled / totalSlots) * 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] font-bold tabular-nums text-muted-foreground/60">
            {totalFilled}/{totalSlots}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between px-5 pb-3 pt-2">
        <div>
          <h2 className="text-2xl font-black leading-none tracking-tight text-foreground">
            {selectedDate.toLocaleDateString(locale, { weekday: "long" }).replace(/^\w/, (c) => c.toUpperCase())}
          </h2>
          <p className={`mt-1 text-sm font-medium ${isToday ? "text-primary" : "text-muted-foreground/60"}`}>
            {selectedDate.toLocaleDateString(locale, { day: "numeric", month: "long" })}
          </p>
        </div>
        {!isToday && TodayButton}
      </div>

      {quickRecipes.length > 0 && dayHasEmptySlot && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {quickRecipes.map((r) => {
            const colorClass = colorForName(r.name);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleQuickAdd(r.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-[0.95] ${colorClass}`}
              >
                <span className="text-[10px] font-black opacity-60">{r.name.charAt(0).toUpperCase()}</span>
                <span className="max-w-[100px] truncate">{r.name}</span>
              </button>
            );
          })}
        </div>
      )}

      <div key={selectedDayIndex} className="animate-fade-in px-4 pb-4">
        <div className="overflow-hidden rounded-3xl bg-card shadow-[0_2px_16px_rgba(28,25,23,0.10)]">
          {MEAL_TYPES.map((mt, i) => (
            <div key={mt}>
              {i > 0 && <div className="mx-4 h-px bg-border/50" />}
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
      </div>

      {pickerState && (
        <RecipePicker
          recipes={recipes}
          userDietaryPreferences={userDietaryPreferences}
          hasExisting={!!activeSlot?.recipeId}
          onSelect={handleSelectRecipe}
          onClear={handleClearSlot}
          onClose={() => setPickerState(null)}
        />
      )}
    </>
  );
}
