"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useLingui, Trans } from "@lingui/react/macro";
import { searchProducts } from "@/applications/catalog/application/useCases/searchProducts";
import { linkIngredient } from "@/applications/catalog/application/useCases/linkIngredient";
import { NutriScoreBadge } from "./nutriscoreBadge";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";

interface ProductSearchSheetProps {
  ingredientId: string;
  ingredientName: string;
  recipeId: string;
  onClose: () => void;
}

const DISMISS_THRESHOLD = 120;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

export function ProductSearchSheet({
  ingredientId,
  ingredientName,
  recipeId,
  onClose,
}: ProductSearchSheetProps) {
  const { t } = useLingui();
  const [query, setQuery] = useState(ingredientName);
  const [results, setResults] = useState<OFFProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [, startLinkTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchGenRef = useRef(0);

  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isDismissingRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const gen = ++searchGenRef.current;
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const products = await searchProducts(query);
      if (gen === searchGenRef.current) {
        setResults(products);
        setIsSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      searchGenRef.current++;
    };
  }, [query]);

  useEffect(() => {
    if (ingredientName) {
      searchProducts(ingredientName).then(setResults);
    }
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
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`;
    if (backdropRef.current) {
      backdropRef.current.style.opacity = String(Math.max(0, 1 - delta / 280));
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

  function handleSelect(product: OFFProduct) {
    dismiss();
    startLinkTransition(() => linkIngredient(ingredientId, product, recipeId));
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        ref={backdropRef}
        className="fixed inset-0 z-60 bg-black/40"
        onClick={dismiss}
        aria-hidden
      />
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-61 flex max-h-[80vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
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
              <Trans>Link to a product</Trans>
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
          <div className="px-5 pb-3">
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t`Search Open Food Facts…`}
                autoFocus
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-gray-300 transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {isSearching && (
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-2">
          {results.length === 0 && !isSearching ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              {query.trim().length >= 2
                ? <Trans>No results found.</Trans>
                : <Trans>Type to search for a product.</Trans>}
            </p>
          ) : (
            results.map((product) => (
              <button
                key={product.offId}
                type="button"
                onClick={() => handleSelect(product)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-gray-50 active:scale-[0.99]"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-10 w-10 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg">
                    🛒
                  </span>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold text-foreground">{product.name}</span>
                  {product.brand && (
                    <span className="truncate text-xs text-gray-400">{product.brand}</span>
                  )}
                </div>
                {product.nutriscoreGrade && (
                  <NutriScoreBadge grade={product.nutriscoreGrade} />
                )}
              </button>
            ))
          )}
        </div>
        <div className="h-safe" />
      </div>
    </>,
    document.body
  );
}
