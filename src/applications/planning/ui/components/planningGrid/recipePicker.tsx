"use client";

import { Trans } from "@lingui/react/macro";

interface Recipe {
  id: string;
  name: string;
}

interface RecipePickerProps {
  recipes: Recipe[];
  hasExisting: boolean;
  onSelect: (recipeId: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function RecipePicker({ recipes, hasExisting, onSelect, onClear, onClose }: RecipePickerProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-100 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed bottom-0 left-0 right-0 z-101 flex max-h-[70vh] flex-col rounded-t-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
          <h3 className="text-sm font-semibold text-foreground">
            <Trans>Choose a recipe</Trans>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-gray-500"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {recipes.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              <Trans>No recipes yet. Create one first.</Trans>
            </p>
          ) : (
            recipes.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => onSelect(recipe.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted active:scale-[0.98]"
              >
                <span className="text-sm font-medium text-foreground">{recipe.name}</span>
              </button>
            ))
          )}
        </div>

        {hasExisting && (
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={onClear}
              className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-destructive transition hover:bg-red-50 active:scale-[0.98]"
            >
              <Trans>Remove from this meal</Trans>
            </button>
          </div>
        )}
        <div className="h-safe" />
      </div>
    </>
  );
}
