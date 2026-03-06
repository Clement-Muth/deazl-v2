"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Trans, useLingui } from "@lingui/react/macro";
import { Capacitor } from "@capacitor/core";
import { getScannedProductInfo, type ScannedProductInfo } from "@/applications/catalog/application/useCases/getScannedProductInfo";
import { reportProductPrice } from "@/applications/catalog/application/useCases/reportProductPrice";
import { addPantryItemFromScan } from "@/applications/pantry/application/useCases/addPantryItemFromScan";
import { getUserStores } from "@/applications/user/application/useCases/getUserStores";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";

type Phase = "scanning" | "loading" | "result" | "not_found";
type Tab = "price" | "pantry";

const NUTRISCORE_BG: Record<string, string> = {
  a: "bg-nutriscore-a", b: "bg-nutriscore-b", c: "bg-nutriscore-c", d: "bg-nutriscore-d", e: "bg-nutriscore-e",
};

export function ScanView() {
  const { t } = useLingui();
  const isNative = Capacitor.isNativePlatform();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop(): void } | null>(null);
  const stoppedRef = useRef(false);
  const scanningRef = useRef(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [phase, setPhase] = useState<Phase>("scanning");
  const [product, setProduct] = useState<ScannedProductInfo | null>(null);
  const [scannedEan, setScannedEan] = useState("");
  const [stores, setStores] = useState<UserStoreItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<UserStoreItem | null>(null);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pièce");
  const [tab, setTab] = useState<Tab>("price");
  const [priceSubmitted, setPriceSubmitted] = useState(false);
  const [pantrySubmitted, setPantrySubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pantryQty, setPantryQty] = useState("1");
  const [pantryUnit, setPantryUnit] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    getUserStores().then((s) => {
      setStores(s);
      if (s.length === 1) setSelectedStore(s[0]);
    });
    if (!isNative) {
      startWebScanner();
    }
    return () => {
      stoppedRef.current = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  async function startNativeScanner() {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanError(null);
    stoppedRef.current = false;
    try {
      const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");
      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== "granted" && camera !== "limited") {
        setScanError("Accès caméra refusé. Autorise-le dans les réglages.");
        return;
      }
      const { barcodes } = await BarcodeScanner.scan();
      if (stoppedRef.current || barcodes.length === 0) return;
      stoppedRef.current = true;
      handleEan(barcodes[0].rawValue ?? "");
    } catch {
      // scanner cancelled by user — no-op
    } finally {
      scanningRef.current = false;
    }
  }

  async function startWebScanner() {
    stoppedRef.current = false;
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (result) => {
          if (stoppedRef.current || !result) return;
          stoppedRef.current = true;
          controls.stop();
          controlsRef.current = null;
          handleEan(result.getText());
        },
      );
      controlsRef.current = controls;
    } catch {
      // camera unavailable
    }
  }

  async function handleEan(ean: string) {
    setScannedEan(ean);
    setPhase("loading");
    const info = await getScannedProductInfo(ean);
    if (info) {
      setProduct(info);
      if (info.prices[0]) { setUnit(info.prices[0].unit); setPantryUnit(info.prices[0].unit); }
      setPhase("result");
    } else {
      setPhase("not_found");
    }
  }

  function handleRescan() {
    setPhase("scanning");
    setProduct(null);
    setPrice("");
    setQuantity("1");
    setPriceSubmitted(false);
    setPantrySubmitted(false);
    setSubmitError(null);
    setScanError(null);
    setPantryQty("1");
    if (!isNative) {
      startWebScanner();
    }
  }

  function handlePriceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStore || !product) return;
    const priceVal = parseFloat(price.replace(",", "."));
    const qtyVal = parseFloat(quantity.replace(",", "."));
    if (isNaN(priceVal) || priceVal <= 0 || isNaN(qtyVal) || qtyVal <= 0) return;
    setSubmitError(null);
    startTransition(async () => {
      const result = await reportProductPrice(
        product.offId, product.name, product.brand, product.imageUrl, product.nutriscoreGrade,
        selectedStore.id, priceVal, qtyVal, unit,
      );
      if (result.error) setSubmitError(result.error);
      else setPriceSubmitted(true);
    });
  }

  function handlePantrySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    const qty = parseFloat(pantryQty.replace(",", "."));
    setSubmitError(null);
    startTransition(async () => {
      const result = await addPantryItemFromScan(
        product.name,
        isNaN(qty) ? null : qty,
        pantryUnit || null,
      );
      if (result.error) setSubmitError(result.error);
      else setPantrySubmitted(true);
    });
  }

  const isFullscreen = phase === "scanning" || phase === "loading";

  return (
    <div className="flex h-full flex-col">
      <div className={`relative shrink-0 overflow-hidden bg-black transition-all duration-500 ${isFullscreen ? "h-[calc(100dvh-8rem-var(--sat))] rounded-b-3xl" : "mx-4 h-52 rounded-3xl"}`}>
        {!isNative && <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />}

        {phase === "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            {isNative ? (
              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={startNativeScanner}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 transition active:scale-95 active:bg-white/20"
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                    <line x1="7" y1="8" x2="7" y2="16"/><line x1="10.5" y1="8" x2="10.5" y2="16"/>
                    <line x1="14" y1="8" x2="14" y2="16"/><line x1="17" y1="8" x2="17" y2="16"/>
                  </svg>
                </button>
                <p className="text-sm font-semibold tracking-wide text-white/70">
                  <Trans>Tap to scan</Trans>
                </p>
                {scanError && (
                  <p className="max-w-[240px] rounded-xl bg-red-500/20 px-4 py-2 text-center text-xs font-semibold text-red-300">
                    {scanError}
                  </p>
                )}
              </div>
            ) : (
              <div className="relative h-40 w-72">
                <div className="absolute inset-0" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" }} />
                <div className="absolute left-0 top-0 h-6 w-6 rounded-tl-xl border-l-2 border-t-2 border-white" />
                <div className="absolute right-0 top-0 h-6 w-6 rounded-tr-xl border-r-2 border-t-2 border-white" />
                <div className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-xl border-b-2 border-l-2 border-white" />
                <div className="absolute bottom-0 right-0 h-6 w-6 rounded-br-xl border-b-2 border-r-2 border-white" />
                <div
                  className="absolute inset-x-3 h-0.5 rounded-full bg-primary"
                  style={{ animation: "scanline 2s ease-in-out infinite", top: "50%", boxShadow: "0 0 8px rgba(22,163,74,0.8)" }}
                />
              </div>
            )}
            {!isNative && (
              <p className="text-xs font-semibold tracking-wide text-white/50">
                <Trans>Point at a product barcode</Trans>
              </p>
            )}
          </div>
        )}

        {phase === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        )}

        {!isFullscreen && (
          <button
            type="button"
            onClick={handleRescan}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.27" />
            </svg>
            <Trans>Scan again</Trans>
          </button>
        )}

        <style>{`
          @keyframes scanline {
            0%, 100% { transform: translateY(-30px); opacity: 0.5; }
            50% { transform: translateY(30px); opacity: 1; }
          }
        `}</style>
      </div>

      {phase === "result" && product && (
        <div className="flex-1 overflow-y-auto bg-linear-to-b from-primary-light via-background to-background">
          <div className="flex flex-col gap-4 px-4 py-4">
            <div
              className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm"
              style={{ animation: "fadeSlideUp 0.3s cubic-bezier(0.22,1,0.36,1) both" }}
            >
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl bg-muted object-contain p-1" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight text-foreground">{product.name}</p>
                {product.brand && <p className="mt-0.5 text-sm text-muted-foreground">{product.brand}</p>}
                {product.nutriscoreGrade && (
                  <span className={`mt-2 inline-block rounded-lg px-2 py-0.5 text-xs font-bold uppercase text-white ${NUTRISCORE_BG[product.nutriscoreGrade] ?? "bg-muted-foreground"}`}>
                    Nutri-score {product.nutriscoreGrade.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {product.prices.length > 0 && (
              <div
                className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]"
                style={{ animation: "fadeSlideUp 0.3s 60ms cubic-bezier(0.22,1,0.36,1) both" }}
              >
                <p className="border-b border-border/60 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Prix connus dans vos magasins
                </p>
                {product.prices.map((p, i) => (
                  <div key={p.storeId} className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-border/60" : ""}`}>
                    <p className="text-sm font-medium text-foreground">{p.storeName}</p>
                    <p className="text-sm font-bold text-foreground">
                      {p.price.toFixed(2)} €
                      <span className="ml-1 text-xs font-normal text-muted-foreground">/ {p.quantity} {p.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div
              className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]"
              style={{ animation: "fadeSlideUp 0.3s 120ms cubic-bezier(0.22,1,0.36,1) both" }}
            >
              <div className="flex border-b border-border/60">
                {(["price", "pantry"] as Tab[]).map((tb) => (
                  <button
                    key={tb}
                    type="button"
                    onClick={() => { setTab(tb); setSubmitError(null); }}
                    className={`flex-1 py-3 text-xs font-bold transition ${
                      tab === tb ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {tb === "price" ? "Signaler un prix" : "Ajouter au stock"}
                  </button>
                ))}
              </div>

              {tab === "price" && (
                <div className="p-4">
                  {priceSubmitted ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-foreground">Prix enregistré — merci !</p>
                      <button type="button" onClick={handleRescan} className="text-xs font-semibold text-primary underline">
                        Scanner un autre produit
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handlePriceSubmit} className="flex flex-col gap-4">
                      {stores.length === 0 ? (
                        <div className="flex items-center justify-between rounded-xl bg-muted px-3.5 py-3">
                          <p className="text-sm text-muted-foreground">Aucun magasin configuré</p>
                          <Link href="/profile" className="text-xs font-bold text-primary">
                            Ajouter →
                          </Link>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {stores.map((store) => (
                            <button
                              key={store.id}
                              type="button"
                              onClick={() => setSelectedStore(store)}
                              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                                selectedStore?.id === store.id ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-secondary"
                              }`}
                            >
                              {store.name}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number" inputMode="decimal" step="0.01" min="0"
                            value={price} onChange={(e) => setPrice(e.target.value)}
                            placeholder="2.49"
                            className="w-full rounded-xl border border-border bg-muted py-2.5 pl-4 pr-7 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">pour</span>
                        <input
                          type="number" inputMode="decimal" step="0.001" min="0"
                          value={quantity} onChange={(e) => setQuantity(e.target.value)}
                          className="w-16 rounded-xl border border-border bg-muted py-2.5 px-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                        />
                        <input
                          type="text" value={unit} onChange={(e) => setUnit(e.target.value)}
                          className="w-20 rounded-xl border border-border bg-muted py-2.5 px-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      {submitError && <p className="text-xs text-destructive">{submitError}</p>}

                      <button
                        type="submit"
                        disabled={!selectedStore || !price}
                        className="rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-40"
                      >
                        Envoyer le prix
                      </button>
                    </form>
                  )}
                </div>
              )}

              {tab === "pantry" && (
                <div className="p-4">
                  {pantrySubmitted ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-foreground">Ajouté au stock !</p>
                      <button type="button" onClick={handleRescan} className="text-xs font-semibold text-primary underline">
                        Scanner un autre produit
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handlePantrySubmit} className="flex flex-col gap-4">
                      <p className="text-xs text-muted-foreground">
                        Ajouter <span className="font-semibold text-foreground">{product.name}</span> à vos stocks
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="number" inputMode="decimal" step="0.001" min="0"
                          value={pantryQty} onChange={(e) => setPantryQty(e.target.value)}
                          placeholder="Qté"
                          className="w-20 rounded-xl border border-border bg-muted py-2.5 px-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                        />
                        <input
                          type="text" value={pantryUnit} onChange={(e) => setPantryUnit(e.target.value)}
                          placeholder="kg, L, pcs…"
                          className="flex-1 rounded-xl border border-border bg-muted py-2.5 px-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      {submitError && <p className="text-xs text-destructive">{submitError}</p>}
                      <button
                        type="submit"
                        className="rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
                      >
                        Ajouter au stock
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>

          <style>{`
            @keyframes fadeSlideUp {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}

      {phase === "not_found" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground"><Trans>Product not found in Open Food Facts</Trans></p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{scannedEan}</p>
          </div>
          <button
            type="button"
            onClick={handleRescan}
            className="mt-1 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
          >
            <Trans>Scan again</Trans>
          </button>
        </div>
      )}
    </div>
  );
}
