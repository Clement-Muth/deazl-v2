"use client";

import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import type { MealSlotData, MealType } from "@/applications/planning/domain/entities/planning";
import type { MessageDescriptor } from "@lingui/core";

const MEAL_LABELS: Record<MealType, MessageDescriptor> = {
  breakfast: msg`Breakfast`,
  lunch: msg`Lunch`,
  dinner: msg`Dinner`,
};

interface MealSlotCellProps {
  slot: MealSlotData;
  onTap: () => void;
  isPending: boolean;
}

export function MealSlotCell({ slot, onTap, isPending }: MealSlotCellProps) {
  const { t } = useLingui();

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={isPending}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-muted active:scale-[0.98] disabled:opacity-50"
    >
      <span className="w-16 shrink-0 text-xs font-medium text-gray-400">
        {t(MEAL_LABELS[slot.mealType])}
      </span>
      {slot.recipeName ? (
        <span className="flex-1 truncate text-sm font-medium text-foreground">{slot.recipeName}</span>
      ) : (
        <span className="flex items-center gap-1 text-sm text-gray-300">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      )}
    </button>
  );
}
