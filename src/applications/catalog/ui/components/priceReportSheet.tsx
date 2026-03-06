"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { Trans } from "@lingui/react/macro";
import { reportPrice } from "@/applications/catalog/application/useCases/reportPrice";
import { getUserStores } from "@/applications/user/application/useCases/getUserStores";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";
import { BottomSheet, SheetHandle, type BottomSheetHandle } from "@/shared/components/ui/bottomSheet";

interface PriceReportSheetProps {
  productId: string;
  productName: string;
  recipeId: string;
  defaultUnit?: string;
  onClose: () => void;
}

export function PriceReportSheet({
  productId,
  productName,
  recipeId,
  defaultUnit = "pièce",
  onClose,
}: PriceReportSheetProps) {
  const [stores, setStores] = useState<UserStoreItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<UserStoreItem | null>(null);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState(defaultUnit);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const bsRef = useRef<BottomSheetHandle>(null);

  useEffect(() => {
    getUserStores().then(setStores);
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!selectedStore) { setError("Sélectionne un magasin"); return; }
    const priceVal = parseFloat(price.replace(",", "."));
    const qtyVal = parseFloat(quantity.replace(",", "."));
    if (isNaN(priceVal) || priceVal <= 0) { setError("Prix invalide"); return; }
    if (isNaN(qtyVal) || qtyVal <= 0) { setError("Quantité invalide"); return; }
    bsRef.current?.dismiss();
    startTransition(async () => { await reportPrice(productId, recipeId, selectedStore.id, priceVal, qtyVal, unit); });
  }

  return (
    <BottomSheet ref={bsRef} onClose={onClose} maxHeight="90vh">
      <SheetHandle>
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h3 className="text-base font-semibold text-foreground"><Trans>Report a price</Trans></h3>
            <p className="max-w-55 truncate text-xs text-muted-foreground/70">{productName}</p>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70"><Trans>Store</Trans></p>
          {stores.length === 0 ? (
            <p className="text-sm text-muted-foreground/70">
              <Trans>No stores added yet. Add stores in your profile.</Trans>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stores.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => setSelectedStore(store)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                    selectedStore?.id === store.id
                      ? "bg-primary text-white"
                      : "bg-muted text-gray-600 hover:bg-gray-200"
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
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2.49"
                autoFocus
                className="w-full rounded-xl border border-border bg-muted/60 py-2.5 pl-4 pr-8 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70">€</span>
            </div>
            <span className="flex items-center text-sm text-muted-foreground/70"><Trans>for</Trans></span>
            <input
              type="number"
              inputMode="decimal"
              step="0.001"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20 rounded-xl border border-border bg-muted/60 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-20 rounded-xl border border-border bg-muted/60 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          className="mt-auto rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.98]"
        >
          <Trans>Submit price</Trans>
        </button>
      </form>
    </BottomSheet>
  );
}
