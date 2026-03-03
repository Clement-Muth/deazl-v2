"use client";

import { useTransition } from "react";
import { toggleShoppingItem } from "@/applications/shopping/application/useCases/toggleShoppingItem";
import type { ShoppingItem } from "@/applications/shopping/domain/entities/shopping";

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string, checked: boolean) => void;
}

export function ShoppingItemRow({ item, onToggle }: ShoppingItemRowProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange() {
    const next = !item.isChecked;
    onToggle(item.id, next);
    startTransition(() => toggleShoppingItem(item.id, next));
  }

  return (
    <button
      type="button"
      onClick={handleChange}
      disabled={isPending}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted active:scale-[0.99] disabled:opacity-60"
    >
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
        item.isChecked ? "border-primary bg-primary" : "border-gray-300"
      }`}>
        {item.isChecked && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </span>

      <span className={`flex-1 text-sm ${item.isChecked ? "text-gray-400 line-through" : "font-medium text-foreground"}`}>
        {item.customName}
      </span>

      <span className={`shrink-0 text-sm ${item.isChecked ? "text-gray-300" : "text-gray-500"}`}>
        {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(2).replace(/\.?0+$/, "")} {item.unit}
      </span>
    </button>
  );
}
