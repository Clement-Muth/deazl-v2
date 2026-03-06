"use client";

import { formatDayHeader } from "@/applications/planning/lib/weekUtils";

interface DayStripProps {
  weekDays: Date[];
  locale: string;
  selectedIndex: number;
  filledCounts: number[];
  onSelect: (index: number) => void;
}

export function DayStrip({ weekDays, locale, selectedIndex, filledCounts, onSelect }: DayStripProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {weekDays.map((date, i) => {
        const { name, num, isToday } = formatDayHeader(date, locale);
        const isSelected = i === selectedIndex;
        const abbr = name.substring(0, 2);
        const filled = filledCounts[i] ?? 0;

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={`flex min-w-11 flex-1 flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 transition-all duration-200 active:scale-[0.93] ${
              isSelected
                ? "bg-card shadow-md shadow-black/8"
                : "hover:bg-white/50"
            }`}
          >
            <span className={`text-[9px] font-bold uppercase tracking-widest leading-none transition-colors ${
              isSelected ? "text-primary/60" : "text-muted-foreground/50"
            }`}>
              {abbr}
            </span>

            <span className={`font-black leading-none transition-all ${
              isSelected
                ? "text-primary text-[22px]"
                : isToday
                ? "text-primary text-base"
                : "text-foreground text-base"
            }`}>
              {num}
            </span>

            <div className="flex gap-0.5">
              {[0, 1, 2].map((j) => (
                <span
                  key={j}
                  className={`h-1 w-1 rounded-full transition-colors ${
                    j < filled
                      ? isSelected
                        ? "bg-primary"
                        : "bg-primary/40"
                      : "bg-border"
                  }`}
                />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
