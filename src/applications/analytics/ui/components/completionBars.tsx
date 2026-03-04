"use client";

import type { ListStat } from "@/applications/analytics/domain/entities/analytics";

interface Props {
  lists: ListStat[];
}

export function CompletionBars({ lists }: Props) {
  if (!lists.length) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {lists.map((list) => {
        const pct = list.totalItems > 0 ? Math.round((list.checkedItems / list.totalItems) * 100) : 0;
        const date = new Date(list.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
        return (
          <div key={list.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500">{date}</span>
              <span className="font-semibold text-gray-700">{list.checkedItems}/{list.totalItems} cochés</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
