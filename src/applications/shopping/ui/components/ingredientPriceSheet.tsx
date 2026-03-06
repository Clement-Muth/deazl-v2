"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { reportIngredientPrice } from "@/applications/shopping/application/useCases/reportIngredientPrice";
import { searchProductsForPricing } from "@/applications/shopping/application/useCases/searchProductsForPricing";
import { reportProductPriceFromShopping } from "@/applications/shopping/application/useCases/reportProductPriceFromShopping";
import { getProductByBarcode } from "@/applications/shopping/application/useCases/getProductByBarcode";
import { getUserStores } from "@/applications/user/application/useCases/getUserStores";
import { BarcodeScannerModal } from "./barcodeScannerModal";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";
import { BottomSheet, SheetHandle, type BottomSheetHandle } from "@/shared/components/ui/bottomSheet";

interface IngredientPriceSheetProps {
  shoppingItemId: string;
  ingredientName: string;
  defaultUnit?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function IngredientPriceSheet({
  shoppingItemId,
  ingredientName,
  defaultUnit = "pièce",
  onClose,
  onSuccess,
}: IngredientPriceSheetProps) {
  const { t } = useLingui();
  const [stores, setStores] = useState<UserStoreItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<UserStoreItem | null>(null);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState(defaultUnit);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState(ingredientName);
  const [searchResults, setSearchResults] = useState<OFFProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<OFFProduct | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [useNameFallback, setUseNameFallback] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isBarcodeLoading, setIsBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bsRef = useRef<BottomSheetHandle>(null);

  const [, startTransition] = useTransition();

  useEffect(() => {
    getUserStores().then(setStores);
    triggerSearch(ingredientName);
  }, []);

  function triggerSearch(q: string) {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchProductsForPricing(q);
      setSearchResults(results);
      setIsSearching(false);
    }, 350);
  }

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    setSelectedProduct(null);
    triggerSearch(q);
  }

  async function handleBarcode(ean: string) {
    setShowScanner(false);
    setBarcodeError(null);
    setIsBarcodeLoading(true);
    const product = await getProductByBarcode(ean);
    setIsBarcodeLoading(false);
    if (product) {
      setSelectedProduct(product);
    } else {
      setBarcodeError(ean);
    }
  }

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    if (!selectedStore) { setError(t`Select a store`); return; }
    const priceVal = parseFloat(price.replace(",", "."));
    const qtyVal = parseFloat(quantity.replace(",", "."));
    if (isNaN(priceVal) || priceVal <= 0) { setError(t`Invalid price`); return; }
    if (isNaN(qtyVal) || qtyVal <= 0) { setError(t`Invalid quantity`); return; }
    bsRef.current?.dismiss();
    if (useNameFallback || !selectedProduct) {
      startTransition(async () => {
        await reportIngredientPrice(ingredientName, selectedStore.id, priceVal, qtyVal, unit);
        onSuccess?.();
      });
    } else {
      startTransition(async () => {
        await reportProductPriceFromShopping(shoppingItemId, selectedProduct, selectedStore.id, priceVal, qtyVal, unit);
        onSuccess?.();
      });
    }
  }

  const showResults = !selectedProduct && !useNameFallback && searchResults.length > 0;

  return (
    <>
      <BottomSheet ref={bsRef} onClose={onClose} maxHeight="92vh">
        <SheetHandle>
          <div className="flex items-center justify-between px-5 py-3">
            <div>
              <h3 className="text-base font-semibold text-foreground"><Trans>Report a price</Trans></h3>
              <p className="max-w-55 truncate text-xs text-muted-foreground/70">{ingredientName}</p>
            </div>
            <button
              type="button"
              onClick={() => bsRef.current?.dismiss()}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-gray-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </SheetHandle>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-8 pt-1">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70"><Trans>Product</Trans></p>

            {selectedProduct ? (
              <div className="flex items-center gap-3 rounded-2xl bg-primary/6 px-4 py-3 ring-1 ring-primary/20">
                {selectedProduct.imageUrl && (
                  <img src={selectedProduct.imageUrl} alt="" className="h-10 w-10 rounded-xl object-contain" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{selectedProduct.name}</p>
                  {selectedProduct.brand && <p className="text-xs text-muted-foreground/70">{selectedProduct.brand}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedProduct(null); setSearchQuery(ingredientName); triggerSearch(ingredientName); }}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-muted-foreground hover:bg-gray-300"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : useNameFallback ? (
              <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="flex-1 text-xs text-amber-700"><Trans>Price linked to ingredient name — less precise</Trans></p>
                <button type="button" onClick={() => setUseNameFallback(false)} className="text-xs font-semibold text-amber-600 underline">
                  <Trans>Search</Trans>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={t`Search product by name…`}
                    className="w-full rounded-xl border border-border bg-muted/60 py-2.5 pl-4 pr-9 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                  {isSearching || isBarcodeLoading ? (
                    <div className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                  ) : (
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition hover:bg-gray-200 active:scale-95"
                  title={t`Scan barcode`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                    <line x1="7" y1="8" x2="7" y2="16"/><line x1="10" y1="8" x2="10" y2="16"/><line x1="13" y1="8" x2="13" y2="16"/><line x1="17" y1="8" x2="17" y2="16"/>
                  </svg>
                </button>
              </div>
            )}

            {barcodeError && (
              <p className="text-xs text-red-500"><Trans>Product not found for barcode {barcodeError}</Trans></p>
            )}

            {showResults && (
              <div className="flex flex-col divide-y divide-gray-100 overflow-hidden rounded-2xl">
                {searchResults.slice(0, 5).map((product) => (
                  <button
                    key={product.offId}
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="flex items-center gap-3 bg-white px-4 py-3 text-left transition hover:bg-muted/60 active:bg-muted"
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
                    ) : (
                      <div className="h-9 w-9 rounded-lg bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                      {product.brand && <p className="text-xs text-muted-foreground/70">{product.brand}</p>}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUseNameFallback(true)}
                  className="bg-muted/60 px-4 py-2.5 text-left text-xs text-muted-foreground/70 transition hover:text-gray-600"
                >
                  <Trans>Not in the list? Report by ingredient name</Trans>
                </button>
              </div>
            )}

            {!showResults && !selectedProduct && !useNameFallback && searchQuery.trim().length >= 2 && !isSearching && (
              <button
                type="button"
                onClick={() => setUseNameFallback(true)}
                className="rounded-xl border border-dashed border-border py-2.5 text-xs text-muted-foreground/70 transition hover:border-gray-300 hover:text-gray-600"
              >
                <Trans>No product found — report by ingredient name</Trans>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70"><Trans>Store</Trans></p>
            {stores.length === 0 ? (
              <p className="text-sm text-muted-foreground/70"><Trans>Add stores in your profile first.</Trans></p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => setSelectedStore(store)}
                    className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                      selectedStore?.id === store.id ? "bg-primary text-white" : "bg-muted text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {store.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70"><Trans>Price</Trans></p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="number" inputMode="decimal" step="0.01" min="0"
                  value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="2.49"
                  className="w-full rounded-xl border border-border bg-muted/60 py-2.5 pl-4 pr-8 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">€</span>
              </div>
              <span className="flex items-center text-sm text-muted-foreground/70"><Trans>for</Trans></span>
              <input
                type="number" inputMode="decimal" step="0.001" min="0"
                value={quantity} onChange={(e) => setQuantity(e.target.value)}
                className="w-20 rounded-xl border border-border bg-muted/60 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="text" value={unit} onChange={(e) => setUnit(e.target.value)}
                className="w-20 rounded-xl border border-border bg-muted/60 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={!useNameFallback && !selectedProduct}
            className="mt-auto rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40"
          >
            <Trans>Submit price</Trans>
          </button>
        </form>
      </BottomSheet>

      {showScanner && (
        <BarcodeScannerModal
          onDetected={handleBarcode}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
}
