"use client";

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
    <div className={`rounded-2xl border bg-white ${isToday ? "border-primary/40" : "border-border"}`}>
      <div className={`flex items-center gap-2 px-4 py-2.5 ${isToday ? "border-b border-primary/20" : "border-b border-border"}`}>
        <span className={`text-sm font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
          {dayName}
        </span>
        <span className={`text-sm ${isToday ? "text-primary/70" : "text-gray-400"}`}>{dayNum}</span>
        {isToday && (
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Today
          </span>
        )}
      </div>
      <div className="flex flex-col divide-y divide-gray-50 py-1">
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
