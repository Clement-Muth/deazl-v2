"use client";

import type { ShoppingItem } from "@/applications/shopping/domain/entities/shopping";

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string, checked: boolean) => void;
  hasDivider?: boolean;
}

export function ShoppingItemRow({ item, onToggle, hasDivider }: ShoppingItemRowProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(item.id, !item.isChecked)}
      className={`flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-black/2 active:scale-[0.99] ${
        hasDivider ? "border-b border-black/4" : ""
      }`}
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
        item.isChecked
          ? "border-primary bg-primary"
          : "border-gray-300"
      }`}>
        {item.isChecked && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </span>

      <span className={`flex-1 text-sm transition-colors ${
        item.isChecked ? "text-gray-400 line-through" : "font-medium text-foreground"
      }`}>
        {item.customName}
      </span>

      <span className={`shrink-0 text-xs font-medium ${item.isChecked ? "text-gray-300" : "text-gray-400"}`}>
        {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(2).replace(/\.?0+$/, "")} {item.unit}
      </span>
    </button>
  );
}
