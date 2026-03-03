"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trans } from "@lingui/react/macro";
import { getProductDetails, type ProductDetails } from "@/applications/catalog/application/useCases/getProductDetails";
import { getAdditiveRisk, parseAdditiveTag } from "@/applications/catalog/domain/additiveRisks";

interface ProductDetailSheetProps {
  productId: string;
  recipeId: string;
  onClose: () => void;
  onReportPrice: () => void;
}

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

const NUTRI_SCORE_MAP: Record<string, number> = { a: 100, b: 75, c: 50, d: 25, e: 0 };
const NOVA_SCORE_MAP: Record<number, number>  = { 1: 100, 2: 75, 3: 25, 4: 0 };

const NUTRI_BG: Record<string, string> = {
  a: "bg-green-500", b: "bg-lime-500", c: "bg-yellow-400", d: "bg-orange-500", e: "bg-red-500",
};
const NOVA_BG: Record<number, string> = {
  1: "bg-green-500", 2: "bg-lime-500", 3: "bg-orange-400", 4: "bg-red-500",
};
const NOVA_LABEL: Record<number, string> = {
  1: "Peu transformé", 2: "Ingrédient culinaire", 3: "Transformé", 4: "Ultra-transformé",
};
const RISK_BAR:   Record<string, string> = { high: "bg-red-500",    moderate: "bg-orange-400", low: "bg-green-500"  };
const RISK_BADGE: Record<string, string> = { high: "bg-red-100 text-red-700", moderate: "bg-orange-100 text-orange-700", low: "bg-green-100 text-green-700" };
const RISK_LABEL: Record<string, string> = { high: "À éviter",  moderate: "Limité",  low: "OK" };

function gradeFromScore(score: number) {
  if (score >= 75) return { label: "Excellent", color: "#22c55e", text: "text-green-600" };
  if (score >= 50) return { label: "Bon",       color: "#84cc16", text: "text-lime-600"  };
  if (score >= 25) return { label: "Médiocre",  color: "#f97316", text: "text-orange-500" };
  return                  { label: "Mauvais",   color: "#ef4444", text: "text-red-600"   };
}

function computeScore(product: ProductDetails, highCount: number): number {
  const ns = product.nutriscoreGrade ? NUTRI_SCORE_MAP[product.nutriscoreGrade.toLowerCase()] : null;
  const nv = product.novaGroup       ? NOVA_SCORE_MAP[product.novaGroup]                       : null;
  const as_ = highCount > 0 ? 0 : 100;
  const parts: { v: number; w: number }[] = [];
  if (ns != null) parts.push({ v: ns,  w: 0.6 });
  if (nv != null) parts.push({ v: nv,  w: 0.3 });
  parts.push({ v: as_, w: 0.1 });
  const tw = parts.reduce((s, p) => s + p.w, 0);
  return Math.round(parts.reduce((s, p) => s + p.v * p.w, 0) / tw);
}

export function ProductDetailSheet({ productId, recipeId, onClose, onReportPrice }: ProductDetailSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sheetRef    = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const startYRef   = useRef(0);
  const isDragging  = useRef(false);
  const isDismissing = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setIsLoading(true);
    getProductDetails(productId).then((d) => { setProduct(d); setIsLoading(false); });
  }, [productId]);

  useEffect(() => {
    const s = sheetRef.current, b = backdropRef.current;
    if (!s || !b) return;
    b.style.opacity = "0"; s.style.transform = "translateY(100%)"; s.style.transition = "none";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      b.style.opacity = "1"; b.style.transition = "opacity 0.25s ease";
      s.style.transform = "translateY(0)"; s.style.transition = `transform 0.35s ${EASE}`;
    }));
  }, []);

  function dismiss() {
    if (isDismissing.current) return;
    isDismissing.current = true;
    const s = sheetRef.current, b = backdropRef.current;
    if (s) { s.style.transform = "translateY(100%)"; s.style.transition = `transform 0.3s ${EASE}`; }
    if (b) { b.style.opacity = "0"; b.style.transition = "opacity 0.3s ease"; }
    setTimeout(onClose, 300);
  }

  function onDragStart(e: React.TouchEvent) {
    if (isDismissing.current) return;
    startYRef.current = e.touches[0].clientY;
    isDragging.current = true;
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  }
  function onDragMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const d = Math.max(0, e.touches[0].clientY - startYRef.current);
    if (sheetRef.current)   sheetRef.current.style.transform   = `translateY(${d}px)`;
    if (backdropRef.current) backdropRef.current.style.opacity = String(Math.max(0, 1 - d / 280));
  }
  function onDragEnd(e: React.TouchEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const d = Math.max(0, e.changedTouches[0].clientY - startYRef.current);
    if (d > 120) {
      dismiss();
    } else {
      if (sheetRef.current)   { sheetRef.current.style.transform    = "translateY(0)"; sheetRef.current.style.transition    = `transform 0.3s ${EASE}`; }
      if (backdropRef.current) { backdropRef.current.style.opacity  = "1";             backdropRef.current.style.transition = "opacity 0.2s ease"; }
    }
  }

  const off = product?.off ?? null;
  const additives = (off?.additiveTags ?? [])
    .map(parseAdditiveTag).filter((a): a is NonNullable<typeof a> => a !== null)
    .map((a) => ({ ...a, risk: getAdditiveRisk(a.code) }))
    .sort((a, b) => ({ high: 0, moderate: 1, low: 2 }[a.risk] - ({ high: 0, moderate: 1, low: 2 }[b.risk])));
  const allergens = (off?.allergenTags ?? [])
    .map((t) => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " ")).filter(Boolean);
  const highCount = additives.filter((a) => a.risk === "high").length;
  const score = product ? computeScore(product, highCount) : 0;
  const grade = gradeFromScore(score);

  if (!mounted) return null;

  const r = 58, circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75;
  const progressLen = arcLen * (score / 100);

  return createPortal(
    <>
      <div ref={backdropRef} className="fixed inset-0 z-60 bg-black/40" onClick={dismiss} aria-hidden />
      <div ref={sheetRef} className="fixed bottom-0 left-0 right-0 z-61 flex max-h-[92vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl">

        {/* Drag handle */}
        <div className="shrink-0 touch-none" onTouchStart={onDragStart} onTouchMove={onDragMove} onTouchEnd={onDragEnd}>
          <div className="flex justify-center pb-2 pt-3">
            <div className="h-1 w-10 rounded-full bg-gray-200" />
          </div>
        </div>

        {isLoading || !product ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <svg className="animate-spin text-gray-300" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto">

            {/* ── Header ─────────────────────────────── */}
            <div className="flex items-center gap-4 px-5 pt-2 pb-4">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-14 w-14 shrink-0 rounded-2xl object-contain bg-gray-50" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-2xl">🛒</div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-bold leading-tight text-gray-900">{product.name}</h2>
                {product.brand && <p className="mt-0.5 text-sm text-gray-400">{product.brand}</p>}
              </div>
            </div>

            {/* ── Score hero ─────────────────────────── */}
            <div className="flex flex-col items-center gap-5 border-y border-gray-100 bg-gray-50 px-5 py-6">
              {/* Circle */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative" style={{ filter: `drop-shadow(0 0 18px ${grade.color}55)` }}>
                  <svg width="152" height="152" viewBox="0 0 152 152">
                    <circle
                      cx="76" cy="76" r={r}
                      fill="none"
                      stroke={`${grade.color}22`}
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeDasharray={`${arcLen} ${circ - arcLen}`}
                      transform="rotate(135 76 76)"
                    />
                    <circle
                      cx="76" cy="76" r={r}
                      fill="none"
                      stroke={grade.color}
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeDasharray={`${progressLen} ${circ - progressLen}`}
                      transform="rotate(135 76 76)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-black leading-none tabular-nums ${grade.text}`}>{score}</span>
                    <span className="text-xs font-medium text-gray-400">/100</span>
                  </div>
                </div>
                <span className={`text-lg font-bold ${grade.text}`}>{grade.label}</span>
              </div>

              {/* 3 criteria */}
              <div className="w-full divide-y divide-gray-100 rounded-2xl bg-white px-4 shadow-sm">

                {/* Nutriscore */}
                <div className="flex items-center gap-3 py-3.5">
                  <span className="text-base">🥗</span>
                  <span className="flex-1 text-sm font-medium text-gray-700">Qualité nutritionnelle</span>
                  {product.nutriscoreGrade && NUTRI_BG[product.nutriscoreGrade.toLowerCase()] ? (
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black text-white ${NUTRI_BG[product.nutriscoreGrade.toLowerCase()]}`}>
                      {product.nutriscoreGrade.toUpperCase()}
                    </span>
                  ) : <span className="text-xs text-gray-300">N/A</span>}
                </div>

                {/* Additives summary */}
                <div className="flex items-center gap-3 py-3.5">
                  <span className="text-base">🧪</span>
                  <span className="flex-1 text-sm font-medium text-gray-700">Additifs</span>
                  {additives.length === 0 ? (
                    <span className="text-sm font-semibold text-green-600">Aucun</span>
                  ) : highCount > 0 ? (
                    <span className="text-sm font-semibold text-red-600">{highCount} à éviter</span>
                  ) : (
                    <span className="text-sm font-semibold text-orange-500">{additives.length} limité{additives.length > 1 ? "s" : ""}</span>
                  )}
                </div>

                {/* Nova */}
                <div className="flex items-center gap-3 py-3.5">
                  <span className="text-base">⚙️</span>
                  <span className="flex-1 text-sm font-medium text-gray-700">Transformation</span>
                  {product.novaGroup && NOVA_BG[product.novaGroup] ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">{NOVA_LABEL[product.novaGroup]}</span>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black text-white ${NOVA_BG[product.novaGroup]}`}>
                        {product.novaGroup}
                      </span>
                    </div>
                  ) : <span className="text-xs text-gray-300">N/A</span>}
                </div>

              </div>
            </div>

            {/* ── Content sections ───────────────────── */}
            <div className="flex flex-col">

              {/* Additives detail */}
              <div className="px-5 py-5">
                <p className="mb-4 text-sm font-semibold text-gray-900">
                  Additifs
                  {additives.length > 0 && <span className="ml-1 font-normal text-gray-400">· {additives.length} détecté{additives.length > 1 ? "s" : ""}</span>}
                </p>

                {additives.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold text-green-700">Aucun additif détecté</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0">
                    {additives.map((a, i) => (
                      <div key={a.code} className={`flex items-center gap-3.5 py-3.5 ${i < additives.length - 1 ? "border-b border-gray-100" : ""}`}>
                        <div className={`h-9 w-0.75 shrink-0 rounded-full ${RISK_BAR[a.risk]}`} />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-sm font-medium leading-tight text-gray-900">{a.name}</span>
                          <span className="text-[11px] font-bold uppercase text-gray-400">{a.code}</span>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${RISK_BADGE[a.risk]}`}>
                          {RISK_LABEL[a.risk]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Allergens */}
              {allergens.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-5">
                  <p className="mb-3 text-sm font-semibold text-gray-900">Allergènes</p>
                  <div className="flex flex-wrap gap-2">
                    {allergens.map((a) => (
                      <span key={a} className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold capitalize text-amber-700">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Nutrients */}
              {off?.nutriments && Object.values(off.nutriments).some((v) => v !== null) && (
                <div className="border-t border-gray-100 px-5 py-5">
                  <p className="mb-4 text-sm font-semibold text-gray-900">
                    Valeurs nutritionnelles <span className="font-normal text-gray-400">/ 100g</span>
                  </p>
                  <div className="flex flex-col">
                    {([
                      { label: "Énergie",          v: off.nutriments.energyKcal,    unit: "kcal", sub: false, warn: false },
                      { label: "Graisses",          v: off.nutriments.fat,           unit: "g",    sub: false, warn: (off.nutriments.fat ?? 0) > 20 },
                      { label: "dont saturées",     v: off.nutriments.saturatedFat,  unit: "g",    sub: true,  warn: (off.nutriments.saturatedFat ?? 0) > 5 },
                      { label: "Glucides",          v: off.nutriments.carbohydrates, unit: "g",    sub: false, warn: false },
                      { label: "dont sucres",       v: off.nutriments.sugars,        unit: "g",    sub: true,  warn: (off.nutriments.sugars ?? 0) > 12 },
                      { label: "Fibres",            v: off.nutriments.fiber,         unit: "g",    sub: false, warn: false },
                      { label: "Protéines",         v: off.nutriments.proteins,      unit: "g",    sub: false, warn: false },
                      { label: "Sel",               v: off.nutriments.salt,          unit: "g",    sub: false, warn: (off.nutriments.salt ?? 0) > 1.5 },
                    ] as const).filter((row) => row.v !== null).map((row, i, arr) => (
                      <div key={row.label} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}>
                        <span className={`text-sm ${row.sub ? "pl-4 text-gray-400" : "font-medium text-gray-700"}`}>{row.label}</span>
                        <span className={`text-sm font-semibold ${row.warn ? "text-orange-500" : "text-gray-900"}`}>
                          {typeof row.v === "number" ? (row.v % 1 === 0 ? row.v : row.v.toFixed(1)) : row.v} {row.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingredients */}
              {off?.ingredientsText && (
                <div className="border-t border-gray-100 px-5 py-5">
                  <p className="mb-3 text-sm font-semibold text-gray-900">Ingrédients</p>
                  <p className="text-xs leading-relaxed text-gray-500">{off.ingredientsText}</p>
                </div>
              )}

              {/* Prices */}
              <div className="border-t border-gray-100 px-5 py-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Prix en magasin</p>
                  <button type="button" onClick={() => { dismiss(); setTimeout(onReportPrice, 310); }}
                    className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:opacity-70">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <Trans>Reporter</Trans>
                  </button>
                </div>

                {product.prices.length === 0 ? (
                  <p className="text-sm text-gray-400"><Trans>No prices yet — be the first to report one!</Trans></p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {product.prices.map((p, i) => (
                      <div key={i} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${i === 0 ? "bg-green-50" : "bg-gray-50"}`}>
                        <div className="flex items-center gap-2">
                          {i === 0 && (
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-500">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                          <span className={`text-sm font-medium ${i === 0 ? "text-green-700" : "text-gray-700"}`}>{p.storeName}</span>
                        </div>
                        <span className={`text-sm font-bold ${i === 0 ? "text-green-700" : "text-gray-500"}`}>
                          {p.price.toFixed(2)} €
                          <span className="ml-1 text-xs font-normal text-gray-400">/ {p.quantity} {p.unit}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-8" />
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
