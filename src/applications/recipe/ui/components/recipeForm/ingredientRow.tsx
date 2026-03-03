"use client";

import { useLingui } from "@lingui/react/macro";

interface IngredientRowProps {
  index: number;
  defaultName?: string;
  defaultQuantity?: string;
  defaultUnit?: string;
  onRemove: () => void;
  canRemove: boolean;
}

export function IngredientRow({
  index,
  defaultName = "",
  defaultQuantity = "",
  defaultUnit = "",
  onRemove,
  canRemove,
}: IngredientRowProps) {
  const { t } = useLingui();

  return (
    <div className="flex gap-2 items-center">
      <input
        name="ingredient_name"
        type="text"
        defaultValue={defaultName}
        placeholder={t`Ingredient`}
        className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
        aria-label={t`Ingredient ${index + 1} name`}
      />
      <input
        name="ingredient_quantity"
        type="number"
        min="0.001"
        step="any"
        defaultValue={defaultQuantity}
        placeholder="1"
        className="w-16 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
        aria-label={t`Ingredient ${index + 1} quantity`}
      />
      <input
        name="ingredient_unit"
        type="text"
        defaultValue={defaultUnit}
        placeholder={t`Unit`}
        className="w-20 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
        aria-label={t`Ingredient ${index + 1} unit`}
      />
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-xl p-2 text-gray-400 transition hover:bg-red-50 hover:text-destructive"
          aria-label={t`Remove ingredient ${index + 1}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
