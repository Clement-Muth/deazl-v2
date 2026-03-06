"use client";

import { useState } from "react";
import { useLingui } from "@lingui/react/macro";

const COMMON_UNITS = [
  "g", "kg",
  "ml", "cl", "L",
  "c.à.c", "c.à.s", "tasse",
  "pièce", "tranche", "gousse", "botte", "boîte", "sachet", "pincée",
];

const CUSTOM_KEY = "__custom__";

interface IngredientRowProps {
  index: number;
  defaultName?: string;
  defaultQuantity?: string;
  defaultUnit?: string;
  onRemove: () => void;
  canRemove: boolean;
  onNameChange?: (v: string) => void;
  onQuantityChange?: (v: string) => void;
  onUnitChange?: (v: string) => void;
}

export function IngredientRow({
  index,
  defaultName = "",
  defaultQuantity = "",
  defaultUnit = "",
  onRemove,
  canRemove,
  onNameChange,
  onQuantityChange,
  onUnitChange,
}: IngredientRowProps) {
  const { t } = useLingui();

  const isDefaultCustom = defaultUnit !== "" && !COMMON_UNITS.includes(defaultUnit);
  const [unit, setUnit] = useState(defaultUnit);
  const [isCustom, setIsCustom] = useState(isDefaultCustom);

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === CUSTOM_KEY) {
      setIsCustom(true);
      setUnit("");
      onUnitChange?.("");
    } else {
      setIsCustom(false);
      setUnit(e.target.value);
      onUnitChange?.(e.target.value);
    }
  }

  function handleCustomUnitChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUnit(e.target.value);
    onUnitChange?.(e.target.value);
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-muted/60 px-2.5 py-2">
      <input
        name="ingredient_quantity"
        type="text"
        inputMode="decimal"
        defaultValue={defaultQuantity}
        onChange={(e) => onQuantityChange?.(e.target.value)}
        placeholder="1"
        className="w-14 shrink-0 rounded-xl border border-border bg-white px-2 py-2.5 text-center text-sm font-semibold outline-none transition placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
        aria-label={t`Ingredient ${index + 1} quantity`}
      />

      {isCustom ? (
        <input
          type="text"
          value={unit}
          onChange={handleCustomUnitChange}
          placeholder={t`unit`}
          autoFocus
          className="w-20 shrink-0 rounded-xl border border-primary/40 bg-white px-2.5 py-2.5 text-center text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      ) : (
        <div className="relative w-20 shrink-0">
          <select
            value={unit || ""}
            onChange={handleSelectChange}
            className="w-full appearance-none rounded-xl border border-border bg-white py-2.5 pl-2.5 pr-5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            aria-label={t`Ingredient ${index + 1} unit`}
          >
            <option value="">—</option>
            {COMMON_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
            <option value={CUSTOM_KEY}>Autre…</option>
          </select>
          <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/70">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      )}

      <input
        name="ingredient_name"
        type="text"
        defaultValue={defaultName}
        onChange={(e) => onNameChange?.(e.target.value)}
        placeholder={t`Name`}
        className="flex-1 min-w-0 rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
        aria-label={t`Ingredient ${index + 1} name`}
      />

      <button
        type="button"
        onClick={onRemove}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground/40 transition hover:bg-red-50 hover:text-destructive active:scale-90 ${!canRemove ? "invisible" : ""}`}
        aria-label={t`Remove ingredient ${index + 1}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
