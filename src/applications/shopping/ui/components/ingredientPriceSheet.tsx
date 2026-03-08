"use client";

import { useState, useRef, useEffect } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { reportIngredientPrice } from "@/applications/shopping/application/useCases/reportIngredientPrice";
import { searchProductsForPricing } from "@/applications/shopping/application/useCases/searchProductsForPricing";
import { reportProductPriceFromShopping } from "@/applications/shopping/application/useCases/reportProductPriceFromShopping";
import { getProductByBarcode } from "@/applications/shopping/application/useCases/getProductByBarcode";
import { getProductPriceHistory, type PriceHistoryPoint } from "@/applications/catalog/application/useCases/getProductPriceHistory";
import { getUserStores } from "@/applications/user/application/useCases/getUserStores";
import { BarcodeScannerModal } from "./barcodeScannerModal";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";
import { BottomSheet, SheetHandle, type BottomSheetHandle } from "@/shared/components/ui/bottomSheet";

interface IngredientPriceSheetProps {
  shoppingItemId: string;
  ingredientName: string;
  defaultUnit?: string;
  preselectedStore?: UserStoreItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function IngredientPriceSheet({
  shoppingItemId,
  ingredientName,
  defaultUnit = "pièce",
  preselectedStore,
  onClose,
  onSuccess,
}: IngredientPriceSheetProps) {
  const { t } = useLingui();
  const isStoreMode = !!preselectedStore;

  const [stores, setStores] = useState<UserStoreItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<UserStoreItem | null>(preselectedStore ?? null);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState(defaultUnit);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [successData, setSuccessData] = useState<{
    price: number; quantity: number; unit: string; storeName: string; history: PriceHistoryPoint[];
  } | null>(null);

  const [showProductLink, setShowProductLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState(ingredientName);
  const [searchResults, setSearchResults] = useState<OFFProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<OFFProduct | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [useNameFallback, setUseNameFallback] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isBarcodeLoading, setIsBarcodeLoading] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const bsRef = useRef<BottomSheetHandle>(null);

  useEffect(() => {
    if (!preselectedStore) getUserStores().then(setStores);
    if (!isStoreMode) triggerSearch(ingredientName);
  }, []);

  useEffect(() => {
    if (isStoreMode) setTimeout(() => priceInputRef.current?.focus(), 350);
  }, [isStoreMode]);

  useEffect(() => {
    if (isStoreMode && showProductLink) triggerSearch(ingredientName);
  }, [showProductLink]);

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
    if (product) setSelectedProduct(product);
    else setBarcodeError(ean);
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    if (!selectedStore) { setError(t`Select a store`); return; }
    const priceVal = parseFloat(price.replace(",", "."));
    const qtyVal = parseFloat(quantity.replace(",", "."));
    if (isNaN(priceVal) || priceVal <= 0) { setError(t`Invalid price`); return; }
    if (isNaN(qtyVal) || qtyVal <= 0) { setError(t`Invalid quantity`); return; }
    setIsSending(true);
    if (!selectedProduct) {
      await reportIngredientPrice(ingredientName, selectedStore.id, priceVal, qtyVal, unit);
      setIsSending(false);
      setSuccessData({ price: priceVal, quantity: qtyVal, unit, storeName: selectedStore.name, history: [] });
      onSuccess?.();
      setTimeout(() => bsRef.current?.dismiss(), 2200);
    } else {
      const result = await reportProductPriceFromShopping(shoppingItemId, selectedProduct, selectedStore.id, priceVal, qtyVal, unit);
      setIsSending(false);
      if (result.error) { setError(result.error); return; }
      const history = result.productId ? await getProductPriceHistory(result.productId) : [];
      setSuccessData({ price: priceVal, quantity: qtyVal, unit, storeName: selectedStore.name, history });
      onSuccess?.();
      setTimeout(() => bsRef.current?.dismiss(), history.length > 1 ? 4000 : 2200);
    }
  }

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
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-gray-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </SheetHandle>

        {successData && (
          <div className="flex flex-1 flex-col items-center gap-4 px-5 pb-10 pt-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground"><Trans>Price saved!</Trans></p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {successData.price.toFixed(2)} € / {successData.quantity > 1 ? `${successData.quantity} ` : ""}{successData.unit} — {successData.storeName}
              </p>
            </div>
            {successData.history.length > 1 && (
              <div className="w-full rounded-2xl bg-muted/60 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70"><Trans>Price history</Trans></p>
                <div className="flex flex-col gap-1">
                  {successData.history.slice(-5).reverse().map((h, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{h.storeName} · {h.date}</span>
                      <span className={`text-sm font-semibold ${i === 0 ? "text-primary" : "text-foreground"}`}>{h.price.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!successData && (
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-8 pt-1">
            {isStoreMode ? (
              <StoreModeForm
                preselectedStore={preselectedStore!}
                price={price} setPrice={setPrice}
                quantity={quantity} setQuantity={setQuantity}
                unit={unit} setUnit={setUnit}
                priceInputRef={priceInputRef}
                showProductLink={showProductLink}
                setShowProductLink={setShowProductLink}
                searchQuery={searchQuery}
                searchResults={searchResults}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                isSearching={isSearching}
                isBarcodeLoading={isBarcodeLoading}
                barcodeError={barcodeError}
                showScanner={showScanner}
                setShowScanner={setShowScanner}
                handleSearchChange={handleSearchChange}
                triggerSearch={triggerSearch}
                ingredientName={ingredientName}
                t={t}
              />
            ) : (
              <HomeModeForm
                stores={stores}
                selectedStore={selectedStore}
                setSelectedStore={setSelectedStore}
                price={price} setPrice={setPrice}
                quantity={quantity} setQuantity={setQuantity}
                unit={unit} setUnit={setUnit}
                searchQuery={searchQuery}
                searchResults={searchResults}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                isSearching={isSearching}
                isBarcodeLoading={isBarcodeLoading}
                barcodeError={barcodeError}
                showScanner={showScanner}
                setShowScanner={setShowScanner}
                useNameFallback={useNameFallback}
                setUseNameFallback={setUseNameFallback}
                handleSearchChange={handleSearchChange}
                triggerSearch={triggerSearch}
                ingredientName={ingredientName}
                t={t}
              />
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={isStoreMode ? isSending : ((!useNameFallback && !selectedProduct) || isSending)}
              className="mt-auto rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40"
            >
              {isSending ? <Trans>Saving…</Trans> : <Trans>Submit price</Trans>}
            </button>
          </form>
        )}
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

interface StoreModeFormProps {
  preselectedStore: UserStoreItem;
  price: string; setPrice: (v: string) => void;
  quantity: string; setQuantity: (v: string) => void;
  unit: string; setUnit: (v: string) => void;
  priceInputRef: React.RefObject<HTMLInputElement | null>;
  showProductLink: boolean; setShowProductLink: (v: boolean) => void;
  searchQuery: string;
  searchResults: OFFProduct[];
  selectedProduct: OFFProduct | null;
  setSelectedProduct: (p: OFFProduct | null) => void;
  isSearching: boolean; isBarcodeLoading: boolean;
  barcodeError: string | null;
  showScanner: boolean; setShowScanner: (v: boolean) => void;
  handleSearchChange: (q: string) => void;
  triggerSearch: (q: string) => void;
  ingredientName: string;
  t: (s: TemplateStringsArray, ...args: unknown[]) => string;
}

function StoreModeForm({
  preselectedStore, price, setPrice, quantity, setQuantity, unit, setUnit,
  priceInputRef, showProductLink, setShowProductLink,
  searchQuery, searchResults, selectedProduct, setSelectedProduct,
  isSearching, isBarcodeLoading, barcodeError, showScanner, setShowScanner,
  handleSearchChange, triggerSearch, ingredientName, t,
}: StoreModeFormProps) {
  return (
    <>
      <div className="flex items-center gap-2 rounded-xl bg-primary/8 px-4 py-2.5 ring-1 ring-primary/20">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span className="text-sm font-semibold text-primary">{preselectedStore.name}</span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70"><Trans>Price</Trans></p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              ref={priceInputRef}
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

      <div className="flex flex-col gap-2">
        {!showProductLink ? (
          <button
            type="button"
            onClick={() => setShowProductLink(true)}
            className="flex items-center gap-2 py-1 text-xs font-medium text-muted-foreground/50 transition hover:text-muted-foreground"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <Trans>Link to a product (optional)</Trans>
          </button>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70"><Trans>Product</Trans></p>
            <ProductSearch
              searchQuery={searchQuery}
              searchResults={searchResults}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              isSearching={isSearching}
              isBarcodeLoading={isBarcodeLoading}
              barcodeError={barcodeError}
              showScanner={showScanner}
              setShowScanner={setShowScanner}
              handleSearchChange={handleSearchChange}
              onClear={() => { setSelectedProduct(null); setShowProductLink(false); }}
              onResetSearch={() => { setSelectedProduct(null); handleSearchChange(ingredientName); }}
              showNameFallback={false}
              useNameFallback={false}
              setUseNameFallback={() => {}}
              t={t}
            />
          </>
        )}
      </div>
    </>
  );
}

interface HomeModeFormProps {
  stores: UserStoreItem[];
  selectedStore: UserStoreItem | null; setSelectedStore: (s: UserStoreItem) => void;
  price: string; setPrice: (v: string) => void;
  quantity: string; setQuantity: (v: string) => void;
  unit: string; setUnit: (v: string) => void;
  searchQuery: string;
  searchResults: OFFProduct[];
  selectedProduct: OFFProduct | null;
  setSelectedProduct: (p: OFFProduct | null) => void;
  isSearching: boolean; isBarcodeLoading: boolean;
  barcodeError: string | null;
  showScanner: boolean; setShowScanner: (v: boolean) => void;
  useNameFallback: boolean; setUseNameFallback: (v: boolean) => void;
  handleSearchChange: (q: string) => void;
  triggerSearch: (q: string) => void;
  ingredientName: string;
  t: (s: TemplateStringsArray, ...args: unknown[]) => string;
}

function HomeModeForm({
  stores, selectedStore, setSelectedStore,
  price, setPrice, quantity, setQuantity, unit, setUnit,
  searchQuery, searchResults, selectedProduct, setSelectedProduct,
  isSearching, isBarcodeLoading, barcodeError, showScanner, setShowScanner,
  useNameFallback, setUseNameFallback, handleSearchChange, ingredientName, t,
}: HomeModeFormProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70"><Trans>Product</Trans></p>
        <ProductSearch
          searchQuery={searchQuery}
          searchResults={searchResults}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          isSearching={isSearching}
          isBarcodeLoading={isBarcodeLoading}
          barcodeError={barcodeError}
          showScanner={showScanner}
          setShowScanner={setShowScanner}
          handleSearchChange={handleSearchChange}
          onClear={() => { setSelectedProduct(null); handleSearchChange(ingredientName); }}
          onResetSearch={() => { setSelectedProduct(null); handleSearchChange(ingredientName); }}
          showNameFallback={true}
          useNameFallback={useNameFallback}
          setUseNameFallback={setUseNameFallback}
          t={t}
        />
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
    </>
  );
}

interface ProductSearchProps {
  searchQuery: string;
  searchResults: OFFProduct[];
  selectedProduct: OFFProduct | null;
  setSelectedProduct: (p: OFFProduct | null) => void;
  isSearching: boolean; isBarcodeLoading: boolean;
  barcodeError: string | null;
  showScanner: boolean; setShowScanner: (v: boolean) => void;
  handleSearchChange: (q: string) => void;
  onClear: () => void;
  onResetSearch: () => void;
  showNameFallback: boolean;
  useNameFallback: boolean;
  setUseNameFallback: (v: boolean) => void;
  t: (s: TemplateStringsArray, ...args: unknown[]) => string;
}

function ProductSearch({
  searchQuery, searchResults, selectedProduct, setSelectedProduct,
  isSearching, isBarcodeLoading, barcodeError, showScanner, setShowScanner,
  handleSearchChange, onClear, onResetSearch, showNameFallback, useNameFallback, setUseNameFallback, t,
}: ProductSearchProps) {
  if (selectedProduct) {
    return (
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
          onClick={onClear}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-muted-foreground hover:bg-gray-300"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    );
  }

  if (showNameFallback && useNameFallback) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="flex-1 text-xs text-amber-700"><Trans>Price linked to ingredient name — less precise</Trans></p>
        <button type="button" onClick={() => setUseNameFallback(false)} className="text-xs font-semibold text-amber-600 underline">
          <Trans>Search</Trans>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
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

      {barcodeError && (
        <p className="text-xs text-red-500"><Trans>Product not found for barcode {barcodeError}</Trans></p>
      )}

      {searchResults.length > 0 && (
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
          {showNameFallback && (
            <button
              type="button"
              onClick={() => setUseNameFallback(true)}
              className="bg-muted/60 px-4 py-2.5 text-left text-xs text-muted-foreground/70 transition hover:text-gray-600"
            >
              <Trans>Not in the list? Report by ingredient name</Trans>
            </button>
          )}
        </div>
      )}

      {searchResults.length === 0 && searchQuery.trim().length >= 2 && !isSearching && showNameFallback && (
        <button
          type="button"
          onClick={() => setUseNameFallback(true)}
          className="rounded-xl border border-dashed border-border py-2.5 text-xs text-muted-foreground/70 transition hover:border-gray-300 hover:text-gray-600"
        >
          <Trans>No product found — report by ingredient name</Trans>
        </button>
      )}
    </div>
  );
}
