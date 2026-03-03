import Link from "next/link";
import { formatWeekParam, addWeeks } from "@/applications/planning/lib/weekUtils";

interface WeekNavProps {
  monday: Date;
}

export function WeekNav({ monday }: WeekNavProps) {
  const prevWeek = formatWeekParam(addWeeks(monday, -1));
  const nextWeek = formatWeekParam(addWeeks(monday, 1));

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/planning?week=${prevWeek}`}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-gray-500 transition hover:bg-gray-200 active:scale-[0.94]"
        aria-label="Previous week"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </Link>
      <Link
        href={`/planning?week=${nextWeek}`}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-gray-500 transition hover:bg-gray-200 active:scale-[0.94]"
        aria-label="Next week"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    </div>
  );
}
