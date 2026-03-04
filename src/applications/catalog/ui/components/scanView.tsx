"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { getScannedProductInfo, type ScannedProductInfo } from "@/applications/catalog/application/useCases/getScannedProductInfo";
import { reportProductPrice } from "@/applications/catalog/application/useCases/reportProductPrice";
import { getUserStores } from "@/applications/user/application/useCases/getUserStores";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";

type Phase = "scanning" | "loading" | "result" | "not_found";

const NUTRISCORE_COLOR: Record<string, string> = {
  a: "bg-green-500", b: "bg-lime-500", c: "bg-yellow-400", d: "bg-orange-500", e: "bg-red-500",
};

export function ScanView() {
  const { t } = useLingui();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop(): void } | null>(null);
  const stoppedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("scanning");
  const [product, setProduct] = useState<ScannedProductInfo | null>(null);
  const [scannedEan, setScannedEan] = useState("");
  const [stores, setStores] = useState<UserStoreItem[]>([]);
  const [selectedStore, setSelectedStore] = useState<UserStoreItem | null>(null);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("pièce");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getUserStores().then((s) => {
      setStores(s);
      if (s.length === 1) setSelectedStore(s[0]);
    });
    startScanner();
    return stopScanner;
  }, []);

  async function startScanner() {
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
      // camera unavailable — silent fail
    }
  }

  function stopScanner() {
    stoppedRef.current = true;
    controlsRef.current?.stop();
    controlsRef.current = null;
  }

  async function handleEan(ean: string) {
    setScannedEan(ean);
    setPhase("loading");
    const info = await getScannedProductInfo(ean);
    if (info) {
      setProduct(info);
      if (info.prices[0]) setUnit(info.prices[0].unit);
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
    setSubmitted(false);
    setSubmitError(null);
    startScanner();
  }

  function handleSubmit(e: { preventDefault(): void }) {
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
      if (result.error) {
        setSubmitError(result.error);
      } else {
        setSubmitted(true);
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className={`relative shrink-0 overflow-hidden bg-black transition-all duration-300 ${
        phase === "scanning" || phase === "loading" ? "h-[calc(100vh-96px)]" : "h-52"
      }`}>
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

        {phase === "scanning" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="relative h-36 w-64">
              <div className="absolute inset-0 rounded-lg" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />
              <div className="absolute left-0 top-0 h-5 w-5 rounded-tl-lg border-l-2 border-t-2 border-white" />
              <div className="absolute right-0 top-0 h-5 w-5 rounded-tr-lg border-r-2 border-t-2 border-white" />
              <div className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-lg border-b-2 border-l-2 border-white" />
              <div className="absolute bottom-0 right-0 h-5 w-5 rounded-br-lg border-b-2 border-r-2 border-white" />
              <div
                className="absolute inset-x-2 h-0.5 rounded-full bg-primary opacity-90"
                style={{ animation: "scanline 2s ease-in-out infinite", top: "50%" }}
              />
            </div>
            <p className="text-sm font-medium text-white/60"><Trans>Point at a product barcode</Trans></p>
          </div>
        )}

        {phase === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}

        {(phase === "result" || phase === "not_found") && (
          <button
            type="button"
            onClick={handleRescan}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.27" />
            </svg>
            <Trans>Scan again</Trans>
          </button>
        )}

        <style>{`
          @keyframes scanline {
            0%, 100% { transform: translateY(-28px); opacity: 0.4; }
            50% { transform: translateY(28px); opacity: 1; }
          }
        `}</style>
      </div>

      {phase === "result" && product && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 px-5 py-5">
            <div className="flex items-center gap-4">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl bg-gray-50 object-contain p-1" />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-gray-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight text-foreground">{product.name}</p>
                {product.brand && <p className="text-sm text-gray-400">{product.brand}</p>}
                {product.nutriscoreGrade && (
                  <span className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase text-white ${NUTRISCORE_COLOR[product.nutriscoreGrade] ?? "bg-gray-400"}`}>
                    Nutri-score {product.nutriscoreGrade.toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {product.prices.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400"><Trans>Known prices in your stores</Trans></p>
                <div className="flex flex-col divide-y divide-gray-100 overflow-hidden rounded-2xl ring-1 ring-black/5">
                  {product.prices.map((p) => (
                    <div key={p.storeId} className="flex items-center justify-between bg-white px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{p.storeName}</p>
                      <p className="text-sm font-bold text-foreground">
                        {p.price.toFixed(2)} €
                        <span className="ml-1 text-xs font-normal text-gray-400">/ {p.quantity} {p.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submitted ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800"><Trans>Price reported — merci !</Trans></p>
                <button type="button" onClick={handleRescan} className="text-xs font-semibold text-primary underline">
                  <Trans>Scan another product</Trans>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400"><Trans>Report a price</Trans></p>

                {stores.length === 0 ? (
                  <p className="text-sm text-gray-400"><Trans>Add stores in your profile first.</Trans></p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {stores.map((store) => (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => setSelectedStore(store)}
                        className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                          selectedStore?.id === store.id ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {store.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number" inputMode="decimal" step="0.01" min="0"
                      value={price} onChange={(e) => setPrice(e.target.value)}
                      placeholder="2.49" autoFocus
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-8 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                  </div>
                  <span className="flex items-center text-sm text-gray-400"><Trans>for</Trans></span>
                  <input
                    type="number" inputMode="decimal" step="0.001" min="0"
                    value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    className="w-20 rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="text" value={unit} onChange={(e) => setUnit(e.target.value)}
                    className="w-20 rounded-xl border border-gray-200 bg-gray-50 py-2.5 px-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {submitError && <p className="text-sm text-red-500">{submitError}</p>}

                <button
                  type="submit"
                  disabled={!selectedStore || !price}
                  className="rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40"
                >
                  <Trans>Submit price</Trans>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {phase === "not_found" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700"><Trans>Product not found in Open Food Facts</Trans></p>
          <p className="font-mono text-xs text-gray-400">{scannedEan}</p>
          <button type="button" onClick={handleRescan} className="mt-2 rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white">
            <Trans>Scan again</Trans>
          </button>
        </div>
      )}
    </div>
  );
}
