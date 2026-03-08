"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Trans, useLingui } from "@lingui/react/macro";
import { Capacitor } from "@capacitor/core";
import { getScannedProductInfo, type ScannedProductInfo } from "@/applications/catalog/application/useCases/getScannedProductInfo";
import { reportProductPrice } from "@/applications/catalog/application/useCases/reportProductPrice";
import { addPantryItemFromScan } from "@/applications/pantry/application/useCases/addPantryItemFromScan";
import { searchProducts } from "@/applications/catalog/application/useCases/searchProducts";
import { getUserStores } from "@/applications/user/application/useCases/getUserStores";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";

type Phase = "idle" | "scanning" | "loading" | "result" | "not_found";
type Mode = "scan" | "search";
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
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("scan");
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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OFFProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  async function startNativeScanner() {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanError(null);
    stoppedRef.current = false;
    setPhase("scanning");
    try {
      const { BarcodeScanner } = await import("@capacitor-mlkit/barcode-scanning");
      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== "granted" && camera !== "limited") {
        setScanError("Accès caméra refusé. Autorise-le dans les réglages.");
        setPhase("idle");
        return;
      }
      const { barcodes } = await BarcodeScanner.scan();
      if (stoppedRef.current || barcodes.length === 0) { setPhase("idle"); return; }
      stoppedRef.current = true;
      handleEan(barcodes[0].rawValue ?? "");
    } catch {
      setPhase("idle");
    } finally {
      scanningRef.current = false;
    }
  }

  async function startWebScanner() {
    stoppedRef.current = false;
    setPhase("scanning");
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

  async function handleSelectSearchResult(off: OFFProduct) {
    setPhase("loading");
    const info = await getScannedProductInfo(off.offId);
    setProduct(info ?? {
      offId: off.offId,
      name: off.name,
      brand: off.brand,
      imageUrl: off.imageUrl,
      nutriscoreGrade: off.nutriscoreGrade,
      prices: [],
    });
    if (info?.prices[0]) { setUnit(info.prices[0].unit); setPantryUnit(info.prices[0].unit); }
    setPhase("result");
  }

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchProducts(q);
      setSearchResults(results);
      setIsSearching(false);
    }, 400);
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
    setSearchQuery("");
    setSearchResults([]);
    if (!isNative && mode === "scan") {
      startWebScanner();
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setPhase(m === "scan" ? "scanning" : "idle");
    setProduct(null);
    setSearchQuery("");
    setSearchResults([]);
    setPriceSubmitted(false);
    setPantrySubmitted(false);
    setSubmitError(null);
    if (m === "scan" && !isNative) {
      stoppedRef.current = false;
      startWebScanner();
    } else if (m === "search") {
      stoppedRef.current = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
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

  const isScanFullscreen = mode === "scan" && (phase === "scanning" || phase === "loading");
  const showProductResult = phase === "result" && product;
  const showNotFound = phase === "not_found";
  const showSearchUI = mode === "search" && phase !== "result" && phase !== "loading";
  const showModeToggle = !showProductResult && !showNotFound && phase !== "loading";

  return (
    <div className="flex h-full flex-col">
      {showModeToggle && (
        <div className="flex gap-1 px-4 pt-4 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => switchMode("scan")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
              mode === "scan" ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
              <line x1="7" y1="8" x2="7" y2="16"/><line x1="10.5" y1="8" x2="10.5" y2="16"/>
              <line x1="14" y1="8" x2="14" y2="16"/><line x1="17" y1="8" x2="17" y2="16"/>
            </svg>
            Scanner
          </button>
          <button
            type="button"
            onClick={() => switchMode("search")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
              mode === "search" ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Rechercher
          </button>
        </div>
      )}

      {mode === "scan" && (
        <div className={`relative shrink-0 overflow-hidden bg-black transition-all duration-500 ${isScanFullscreen ? "h-[calc(100dvh-8rem-var(--sat))] rounded-b-3xl" : "mx-4 h-52 rounded-3xl"}`}>
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

          {!isScanFullscreen && phase !== "loading" && (
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
      )}

      {phase === "loading" && mode === "search" && (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
        </div>
      )}

      {showSearchUI && (
        <div className="flex flex-1 flex-col overflow-hidden px-4 pt-2">
          <div className="relative mb-3">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Nutella, lait demi-écrémé, yaourt…"
              autoFocus
              className="w-full rounded-2xl border border-border bg-muted/60 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
            {isSearching && (
              <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            )}
          </div>

          {searchQuery.trim().length < 2 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-muted">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <p className="text-sm text-muted-foreground/60">Tape le nom d'un produit pour le trouver dans Open Food Facts</p>
            </div>
          )}

          {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 pb-20 text-center">
              <p className="text-sm font-medium text-foreground">Aucun résultat</p>
              <p className="text-xs text-muted-foreground/60">Essaie un autre terme ou scanne le code-barres</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="flex-1 overflow-y-auto">
              <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
                {searchResults.map((item, i) => (
                  <button
                    key={item.offId}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-muted/60 ${i > 0 ? "border-t border-border/40" : ""}`}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl bg-muted object-contain p-0.5" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                      {item.brand && <p className="truncate text-xs text-muted-foreground">{item.brand}</p>}
                    </div>
                    {item.nutriscoreGrade && (
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white ${NUTRISCORE_BG[item.nutriscoreGrade] ?? "bg-muted-foreground"}`}>
                        {item.nutriscoreGrade.toUpperCase()}
                      </span>
                    )}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showProductResult && (
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
              <button
                type="button"
                onClick={handleRescan}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-muted transition active:scale-95"
                aria-label="Retour"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
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
                        {mode === "scan" ? "Scanner un autre produit" : "Rechercher un autre produit"}
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
                        {mode === "scan" ? "Scanner un autre produit" : "Rechercher un autre produit"}
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

      {showNotFound && (
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
