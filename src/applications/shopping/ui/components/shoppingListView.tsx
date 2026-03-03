"use client";

import { useOptimistic, useTransition } from "react";
import { useLingui, Trans } from "@lingui/react/macro";
import { clearCheckedItems } from "@/applications/shopping/application/useCases/clearCheckedItems";
import { ShoppingItemRow } from "./shoppingItemRow";
import { AddItemForm } from "./addItemForm";
import type { ShoppingItem, ShoppingList } from "@/applications/shopping/domain/entities/shopping";

interface ShoppingListViewProps {
  list: ShoppingList;
}

export function ShoppingListView({ list }: ShoppingListViewProps) {
  const { t } = useLingui();
  type OptAction =
    | { type: "toggle"; id: string; isChecked: boolean }
    | { type: "clear" };

  const [items, dispatch] = useOptimistic(
    list.items,
    (state: ShoppingItem[], action: OptAction) => {
      if (action.type === "toggle") {
        return state.map((item) => item.id === action.id ? { ...item, isChecked: action.isChecked } : item);
      }
      if (action.type === "clear") {
        return state.filter((item) => !item.isChecked);
      }
      return state;
    }
  );
  const [isClearPending, startClearTransition] = useTransition();

  const checkedCount = items.filter((i) => i.isChecked).length;
  const unchecked = items.filter((i) => !i.isChecked).sort((a, b) => a.sortOrder - b.sortOrder);
  const checked = items.filter((i) => i.isChecked).sort((a, b) => a.sortOrder - b.sortOrder);

  function handleToggle(id: string, isChecked: boolean) {
    dispatch({ type: "toggle", id, isChecked });
  }

  function handleClear() {
    dispatch({ type: "clear" });
    startClearTransition(() => clearCheckedItems(list.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-4">
        <p className="text-sm text-gray-500">
          {checkedCount === 0
            ? <Trans>{items.length} items</Trans>
            : <Trans>{checkedCount}/{items.length} checked</Trans>}
        </p>
        {checkedCount > 0 && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isClearPending}
            className="text-sm font-medium text-destructive transition hover:opacity-70 disabled:opacity-40"
          >
            <Trans>Clear checked</Trans>
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-white divide-y divide-gray-50">
        {unchecked.map((item) => (
          <ShoppingItemRow key={item.id} item={item} onToggle={handleToggle} />
        ))}
        {unchecked.length === 0 && checked.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">
            <Trans>All done!</Trans>
          </p>
        )}
        {checked.map((item) => (
          <ShoppingItemRow key={item.id} item={item} onToggle={handleToggle} />
        ))}
      </div>

      <div className="px-4">
        <AddItemForm listId={list.id} />
      </div>
    </div>
  );
}
