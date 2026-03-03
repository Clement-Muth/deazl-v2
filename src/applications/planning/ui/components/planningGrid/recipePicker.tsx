"use client";

import { useState, useRef, useEffect } from "react";
import { useLingui, Trans } from "@lingui/react/macro";

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

const DISMISS_THRESHOLD = 120;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

export function RecipePicker({ recipes, hasExisting, onSelect, onClear, onClose }: RecipePickerProps) {
  const { t } = useLingui();
  const [search, setSearch] = useState("");

  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isDismissingRef = useRef(false);

  useEffect(() => {
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !backdrop) return;

    backdrop.style.opacity = "0";
    sheet.style.transform = "translateY(100%)";
    sheet.style.transition = "none";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        backdrop.style.opacity = "1";
        backdrop.style.transition = "opacity 0.25s ease";
        sheet.style.transform = "translateY(0)";
        sheet.style.transition = `transform 0.35s ${EASE}`;
      });
    });
  }, []);

  function dismiss() {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (sheet) {
      sheet.style.transform = "translateY(100%)";
      sheet.style.transition = `transform 0.3s ${EASE}`;
    }
    if (backdrop) {
      backdrop.style.opacity = "0";
      backdrop.style.transition = "opacity 0.3s ease";
    }
    setTimeout(onClose, 300);
  }

  function onDragStart(e: React.TouchEvent) {
    if (isDismissingRef.current) return;
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  }

  function onDragMove(e: React.TouchEvent) {
    if (!isDraggingRef.current) return;
    const delta = Math.max(0, e.touches[0].clientY - startYRef.current);
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
    if (backdropRef.current) {
      const opacity = Math.max(0, 1 - delta / 280);
      backdropRef.current.style.opacity = String(opacity);
    }
  }

  function onDragEnd(e: React.TouchEvent) {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const delta = Math.max(0, e.changedTouches[0].clientY - startYRef.current);

    if (delta > DISMISS_THRESHOLD) {
      dismiss();
    } else {
      if (sheetRef.current) {
        sheetRef.current.style.transform = "translateY(0)";
        sheetRef.current.style.transition = `transform 0.3s ${EASE}`;
      }
      if (backdropRef.current) {
        backdropRef.current.style.opacity = "1";
        backdropRef.current.style.transition = "opacity 0.2s ease";
      }
    }
  }

  const filtered = search.trim()
    ? recipes.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    : recipes;

  return (
    <>
      <div
        ref={backdropRef}
        className="fixed inset-0 z-100 bg-black/40"
        onClick={dismiss}
        aria-hidden
      />
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-101 flex max-h-[75vh] flex-col rounded-t-3xl bg-white shadow-2xl"
      >
        <div
          className="shrink-0 touch-none"
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
        >
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-gray-200" />
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <h3 className="text-base font-semibold text-foreground">
              <Trans>Choose a recipe</Trans>
            </h3>
            <button
              type="button"
              onClick={dismiss}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-gray-500 transition hover:bg-gray-200"
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
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none placeholder:text-gray-300 transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pb-2">
          {filtered.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              {search
                ? <Trans>No results found.</Trans>
                : <Trans>No recipes yet. Create one first.</Trans>}
            </p>
          ) : (
            filtered.map((recipe) => {
              const colorClass = colorForName(recipe.name);
              return (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => onSelect(recipe.id)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-gray-50 active:scale-[0.99]"
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
            })
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
      </div>
    </>
  );
}
