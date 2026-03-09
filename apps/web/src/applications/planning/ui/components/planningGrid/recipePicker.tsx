"use client";

import { useState, useRef } from "react";
import { useLingui, Trans } from "@lingui/react/macro";
import { BottomSheet, SheetHandle, type BottomSheetHandle } from "@/shared/components/ui/bottomSheet";

interface Recipe {
  id: string;
  name: string;
  dietaryTags: string[];
  inPantry?: boolean;
}

interface RecipePickerProps {
  recipes: Recipe[];
  userDietaryPreferences: string[];
  hasExisting: boolean;
  onSelect: (recipeId: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const INITIAL_COLORS = [
  "bg-amber-100 text-amber-700",
  "bg-primary-light text-primary",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
}

function RecipeRow({ recipe, onSelect }: { recipe: Recipe; onSelect: (id: string) => void }) {
  const colorClass = colorForName(recipe.name);
  return (
    <button
      type="button"
      onClick={() => onSelect(recipe.id)}
      className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-muted/60 active:scale-[0.99]"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${colorClass}`}>
        {recipe.name.trim().charAt(0).toUpperCase()}
      </span>
      <span className="flex-1 text-sm font-medium text-foreground">{recipe.name}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  );
}

export function RecipePicker({ recipes, userDietaryPreferences, hasExisting, onSelect, onClear, onClose }: RecipePickerProps) {
  const { t } = useLingui();
  const [search, setSearch] = useState("");
  const bsRef = useRef<BottomSheetHandle>(null);

  const base = search.trim()
    ? recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  const inPantry = base.filter((r) => r.inPantry);
  const pantryIds = new Set(inPantry.map((r) => r.id));

  const suggested = userDietaryPreferences.length > 0
    ? base.filter((r) => !pantryIds.has(r.id) && userDietaryPreferences.every((p) => r.dietaryTags.includes(p)))
    : [];
  const suggestedIds = new Set(suggested.map((r) => r.id));
  const rest = base.filter((r) => !pantryIds.has(r.id) && !suggestedIds.has(r.id));
  const filtered = base;
  const hasSections = inPantry.length > 0 || suggested.length > 0;

  return (
    <BottomSheet ref={bsRef} onClose={onClose} maxHeight="75vh" zIndex={100}>
      <SheetHandle>
        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-base font-semibold text-foreground">
            <Trans>Choose a recipe</Trans>
          </h3>
          <button
            type="button"
            onClick={() => bsRef.current?.dismiss()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-gray-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {recipes.length > 3 && (
          <div className="px-5 pb-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t`Search recipes...`}
              className="w-full rounded-xl border border-border bg-muted/60 px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/40 transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
        )}
      </SheetHandle>

      <div className="flex-1 overflow-y-auto pb-2">
        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground/70">
            {search
              ? <Trans>No results found.</Trans>
              : <Trans>No recipes yet. Create one first.</Trans>}
          </p>
        ) : (
          <>
            {inPantry.length > 0 && (
              <>
                <div className="px-5 pb-1 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/80">En stock</span>
                </div>
                {inPantry.map((recipe) => (
                  <RecipeRow key={recipe.id} recipe={recipe} onSelect={onSelect} />
                ))}
              </>
            )}
            {suggested.length > 0 && (
              <>
                <div className="px-5 pb-1 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Compatibles</span>
                </div>
                {suggested.map((recipe) => (
                  <RecipeRow key={recipe.id} recipe={recipe} onSelect={onSelect} />
                ))}
              </>
            )}
            {rest.length > 0 && (
              <>
                {hasSections && (
                  <div className="px-5 pb-1 pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Toutes</span>
                  </div>
                )}
                {rest.map((recipe) => (
                  <RecipeRow key={recipe.id} recipe={recipe} onSelect={onSelect} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {hasExisting && (
        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={onClear}
            className="w-full rounded-xl border border-red-100 bg-red-50 py-3 text-sm font-semibold text-destructive transition hover:bg-red-100 active:scale-[0.98]"
          >
            <Trans>Remove from this meal</Trans>
          </button>
        </div>
      )}
      <div className="h-safe" />
    </BottomSheet>
  );
}
