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
    <div className="flex flex-col gap-2 rounded-2xl bg-gray-50 p-3 ring-1 ring-black/5">
      <div className="flex items-center gap-2">
        <input
          name="ingredient_name"
          type="text"
          defaultValue={defaultName}
          placeholder={t`Ingredient name`}
          className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
          aria-label={t`Ingredient ${index + 1} name`}
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-300 transition hover:bg-red-50 hover:text-destructive"
            aria-label={t`Remove ingredient ${index + 1}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <input
          name="ingredient_quantity"
          type="number"
          min="0.001"
          step="any"
          defaultValue={defaultQuantity}
          placeholder="1"
          className="w-24 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
          aria-label={t`Ingredient ${index + 1} quantity`}
        />
        <input
          name="ingredient_unit"
          type="text"
          defaultValue={defaultUnit}
          placeholder={t`g, ml, pièce…`}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
          aria-label={t`Ingredient ${index + 1} unit`}
        />
      </div>
    </div>
  );
}
