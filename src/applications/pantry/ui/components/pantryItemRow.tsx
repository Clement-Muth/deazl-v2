"use client";

import { useTransition } from "react";
import { deletePantryItem } from "@/applications/pantry/application/useCases/deletePantryItem";
import { updatePantryItemQuantity } from "@/applications/pantry/application/useCases/updatePantryItemQuantity";
import type { PantryItem } from "@/applications/pantry/domain/entities/pantry";

interface Props {
  item: PantryItem;
}

function fmtQty(qty: number): string {
  return qty % 1 === 0 ? String(qty) : qty.toFixed(2).replace(/\.?0+$/, "");
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export function PantryItemRow({ item }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(() => deletePantryItem(item.id));
  }

  function handleDecrement() {
    if (item.quantity === null) return;
    const next = item.quantity - 1;
    startTransition(() => updatePantryItemQuantity(item.id, next <= 0 ? null : next));
  }

  function handleIncrement() {
    const next = (item.quantity ?? 0) + 1;
    startTransition(() => updatePantryItemQuantity(item.id, next));
  }

  const days = item.expiryDate ? daysUntil(item.expiryDate) : null;
  const isExpiringSoon = days !== null && days <= 3;
  const isExpired = days !== null && days < 0;

  return (
    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${isPending ? "opacity-50" : ""} ${isExpired ? "bg-red-50/80" : isExpiringSoon ? "bg-amber-50/80" : "bg-white/80"} shadow-sm ring-1 ${isExpired ? "ring-red-200" : isExpiringSoon ? "ring-amber-200" : "ring-black/5"}`}>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-gray-800">{item.customName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.quantity !== null && (
            <span className="text-xs text-gray-400">
              {fmtQty(item.quantity)}{item.unit ? ` ${item.unit}` : ""}
            </span>
          )}
          {item.expiryDate && (
            <span className={`text-[10px] font-semibold ${isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-500" : "text-gray-400"}`}>
              {isExpired
                ? `Expiré il y a ${Math.abs(days!)}j`
                : days === 0
                ? "Expire aujourd'hui"
                : `Expire dans ${days}j`}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={handleDecrement}
          disabled={isPending}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition active:scale-90 disabled:opacity-40"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={handleIncrement}
          disabled={isPending}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition active:scale-90 disabled:opacity-40"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition hover:text-red-400 active:scale-90 disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
