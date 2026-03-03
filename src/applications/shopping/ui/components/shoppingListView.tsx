"use client";

import { useState, useEffect, useTransition } from "react";
import { Trans } from "@lingui/react/macro";
import { toggleShoppingItem } from "@/applications/shopping/application/useCases/toggleShoppingItem";
import { clearCheckedItems } from "@/applications/shopping/application/useCases/clearCheckedItems";
import { ShoppingItemRow } from "./shoppingItemRow";
import { AddItemForm } from "./addItemForm";
import type { ShoppingItem, ShoppingList } from "@/applications/shopping/domain/entities/shopping";

interface ShoppingListViewProps {
  list: ShoppingList;
}

export function ShoppingListView({ list }: ShoppingListViewProps) {
  const [items, setItems] = useState<ShoppingItem[]>(list.items);
  const [isClearPending, startClearTransition] = useTransition();

  useEffect(() => {
    setItems(list.items);
  }, [list.items]);

  const checkedCount = items.filter((i) => i.isChecked).length;
  const unchecked = items.filter((i) => !i.isChecked).sort((a, b) => a.sortOrder - b.sortOrder);
  const checked = items.filter((i) => i.isChecked).sort((a, b) => a.sortOrder - b.sortOrder);

  function handleToggle(id: string, isChecked: boolean) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, isChecked } : item));
    toggleShoppingItem(id, isChecked);
  }

  function handleClear() {
    setItems((prev) => prev.filter((item) => !item.isChecked));
    startClearTransition(() => clearCheckedItems(list.id));
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-4 pb-8">
      {unchecked.length === 0 && checked.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="text-3xl">✓</span>
          <p className="text-sm font-medium text-gray-400"><Trans>All done!</Trans></p>
        </div>
      ) : (
        <>
          {unchecked.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
              {unchecked.map((item, i) => (
                <ShoppingItemRow
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                  hasDivider={i < unchecked.length - 1}
                />
              ))}
            </div>
          )}

          {checked.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white/50 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-black/5 px-5 py-2.5">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
                  <Trans>{checkedCount} checked</Trans>
                </span>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isClearPending}
                  className="text-xs font-semibold text-destructive transition hover:opacity-70 disabled:opacity-40"
                >
                  <Trans>Clear</Trans>
                </button>
              </div>
              {checked.map((item, i) => (
                <ShoppingItemRow
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                  hasDivider={i < checked.length - 1}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-1">
        <AddItemForm listId={list.id} />
      </div>
    </div>
  );
}
