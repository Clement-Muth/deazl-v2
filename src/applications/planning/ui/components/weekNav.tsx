import Link from "next/link";
import { formatWeekParam, addWeeks, formatWeekRange } from "@/applications/planning/lib/weekUtils";

interface WeekNavProps {
  monday: Date;
  locale: string;
}

export function WeekNav({ monday, locale }: WeekNavProps) {
  const prevWeek = formatWeekParam(addWeeks(monday, -1));
  const nextWeek = formatWeekParam(addWeeks(monday, 1));
  const label = formatWeekRange(monday, locale);

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <Link
        href={`/planning?week=${prevWeek}`}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-gray-500 transition hover:bg-muted active:scale-[0.97]"
        aria-label="Previous week"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Link>

      <span className="flex-1 text-center text-sm font-medium text-gray-700">{label}</span>

      <Link
        href={`/planning?week=${nextWeek}`}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-gray-500 transition hover:bg-muted active:scale-[0.97]"
        aria-label="Next week"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </div>
  );
}
