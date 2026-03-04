"use client";

import { Trans } from "@lingui/react/macro";
import type { MealSlotData, MealType } from "@/applications/planning/domain/entities/planning";
import { MealSlotCell } from "./mealSlotCell";

interface DayCardProps {
  dayName: string;
  dayNum: string;
  isToday: boolean;
  slots: MealSlotData[];
  pendingSlot: { dayOfWeek: number; mealType: MealType } | null;
  onSlotTap: (dayOfWeek: number, mealType: MealType) => void;
}

export function DayCard({ dayName, dayNum, isToday, slots, pendingSlot, onSlotTap }: DayCardProps) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-white ${
      isToday ? "ring-2 ring-primary/25 shadow-md shadow-primary/10" : "ring-1 ring-black/6 shadow-sm"
    }`}>
      <div className={`flex items-center gap-3 px-4 py-3 ${
        isToday ? "bg-primary" : "border-b border-gray-50"
      }`}>
        <div className="flex items-baseline gap-2">
          <span className={`text-[11px] font-bold uppercase tracking-widest ${
            isToday ? "text-white/60" : "text-gray-400"
          }`}>
            {dayName}
          </span>
          <span className={`text-xl font-bold leading-none ${
            isToday ? "text-white" : "text-foreground"
          }`}>
            {dayNum}
          </span>
        </div>
        {isToday && (
          <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            <Trans>Today</Trans>
          </span>
        )}
      </div>

      <div className="flex flex-col">
        {slots.map((slot) => (
          <MealSlotCell
            key={slot.mealType}
            slot={slot}
            onTap={() => onSlotTap(slot.dayOfWeek, slot.mealType)}
            isPending={
              pendingSlot?.dayOfWeek === slot.dayOfWeek &&
              pendingSlot?.mealType === slot.mealType
            }
          />
        ))}
      </div>
    </div>
  );
}
