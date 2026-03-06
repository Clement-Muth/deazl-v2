"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useLingui, Trans } from "@lingui/react/macro";
import { searchProducts } from "@/applications/catalog/application/useCases/searchProducts";
import { linkIngredient } from "@/applications/catalog/application/useCases/linkIngredient";
import { NutriScoreBadge } from "./nutriscoreBadge";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";
import { BottomSheet, SheetHandle, type BottomSheetHandle } from "@/shared/components/ui/bottomSheet";

interface ProductSearchSheetProps {
  ingredientId: string;
  ingredientName: string;
  recipeId: string;
  onClose: () => void;
}

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
  const bsRef = useRef<BottomSheetHandle>(null);

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

  function handleSelect(product: OFFProduct) {
    bsRef.current?.dismiss();
    startLinkTransition(() => linkIngredient(ingredientId, product, recipeId));
  }

  return (
    <BottomSheet ref={bsRef} onClose={onClose} maxHeight="80vh">
      <SheetHandle>
        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-base font-semibold text-foreground">
            <Trans>Link to a product</Trans>
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
        <div className="px-5 pb-3">
          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t`Search Open Food Facts…`}
              autoFocus
              className="w-full rounded-xl border border-border bg-muted/60 py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground/40 transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {isSearching && (
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground/70" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
          </div>
        </div>
      </SheetHandle>

      <div className="flex-1 overflow-y-auto pb-2">
        {results.length === 0 && !isSearching ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground/70">
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
              className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-muted/60 active:scale-[0.99]"
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-10 w-10 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-lg">
                  🛒
                </span>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold text-foreground">{product.name}</span>
                {product.brand && (
                  <span className="truncate text-xs text-muted-foreground/70">{product.brand}</span>
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
    </BottomSheet>
  );
}
