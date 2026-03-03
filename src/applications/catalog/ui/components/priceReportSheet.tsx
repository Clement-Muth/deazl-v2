"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { Trans } from "@lingui/react/macro";
import { reportPrice } from "@/applications/catalog/application/useCases/reportPrice";
import { STORE_BRANDS, type StoreBrand } from "@/applications/catalog/domain/storeBrands";

interface PriceReportSheetProps {
  productId: string;
  productName: string;
  recipeId: string;
  defaultUnit?: string;
  onClose: () => void;
}

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

export function PriceReportSheet({
  productId,
  productName,
  recipeId,
  defaultUnit = "pièce",
  onClose,
}: PriceReportSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreBrand | null>(null);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState(defaultUnit);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

  function dismiss() {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (sheet) { sheet.style.transform = "translateY(100%)"; sheet.style.transition = `transform 0.3s ${EASE}`; }
    if (backdrop) { backdrop.style.opacity = "0"; backdrop.style.transition = "opacity 0.3s ease"; }
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
    if (backdropRef.current) backdropRef.current.style.opacity = String(Math.max(0, 1 - delta / 280));
  }

  function onDragEnd(e: React.TouchEvent) {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const delta = Math.max(0, e.changedTouches[0].clientY - startYRef.current);
    if (delta > 120) {
      dismiss();
    } else {
      if (sheetRef.current) { sheetRef.current.style.transform = "translateY(0)"; sheetRef.current.style.transition = `transform 0.3s ${EASE}`; }
      if (backdropRef.current) { backdropRef.current.style.opacity = "1"; backdropRef.current.style.transition = "opacity 0.2s ease"; }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedStore) { setError("Sélectionne un magasin"); return; }
    const priceVal = parseFloat(price.replace(",", "."));
    const qtyVal = parseFloat(quantity.replace(",", "."));
    if (isNaN(priceVal) || priceVal <= 0) { setError("Prix invalide"); return; }
    if (isNaN(qtyVal) || qtyVal <= 0) { setError("Quantité invalide"); return; }
    dismiss();
    startTransition(async () => { await reportPrice(productId, recipeId, selectedStore, priceVal, qtyVal, unit); });
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <div ref={backdropRef} className="fixed inset-0 z-60 bg-black/40" onClick={dismiss} aria-hidden />
      <div ref={sheetRef} className="fixed bottom-0 left-0 right-0 z-61 flex max-h-[90vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl">
        <div className="shrink-0 touch-none" onTouchStart={onDragStart} onTouchMove={onDragMove} onTouchEnd={onDragEnd}>
          <div className="flex justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-gray-200" />
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div>
              <h3 className="text-base font-semibold text-foreground"><Trans>Report a price</Trans></h3>
              <p className="text-xs text-gray-400 truncate max-w-[220px]">{productName}</p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-gray-500 transition hover:bg-gray-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-8 pt-1">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400"><Trans>Store</Trans></p>
            <div className="flex flex-wrap gap-2">
              {STORE_BRANDS.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedStore(brand)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                    selectedStore === brand
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400"><Trans>Price</Trans></p>
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
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-8 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
              </div>
              <span className="flex items-center text-sm text-gray-400"><Trans>for</Trans></span>
              <input
                type="number"
                inputMode="decimal"
                step="0.001"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20 rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-20 rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
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
      </div>
    </>,
    document.body
  );
}
