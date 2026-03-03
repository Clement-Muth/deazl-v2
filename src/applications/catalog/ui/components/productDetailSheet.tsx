"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trans } from "@lingui/react/macro";
import { getProductDetails, type ProductDetails } from "@/applications/catalog/application/useCases/getProductDetails";
import { getAdditiveRisk, parseAdditiveTag } from "@/applications/catalog/domain/additiveRisks";
import { NutriScoreBadge } from "./nutriscoreBadge";

interface ProductDetailSheetProps {
  productId: string;
  recipeId: string;
  onClose: () => void;
  onReportPrice: () => void;
}

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

const NOVA_CONFIG: Record<number, { bg: string; text: string; label: string; desc: string }> = {
  1: { bg: "bg-green-500", text: "text-green-700", label: "Groupe 1", desc: "Aliments peu ou pas transformés" },
  2: { bg: "bg-lime-400", text: "text-lime-700", label: "Groupe 2", desc: "Ingrédients culinaires transformés" },
  3: { bg: "bg-orange-400", text: "text-orange-700", label: "Groupe 3", desc: "Aliments transformés" },
  4: { bg: "bg-red-500", text: "text-red-700", label: "Groupe 4", desc: "Produits ultra-transformés" },
};

const ECOSCORE_BG: Record<string, string> = {
  a: "bg-green-500", b: "bg-lime-500", c: "bg-yellow-400", d: "bg-orange-500", e: "bg-red-500",
};

const RISK_STYLE = {
  high: { pill: "bg-red-100 text-red-700 border border-red-200", dot: "bg-red-500", label: "À éviter" },
  moderate: { pill: "bg-orange-100 text-orange-700 border border-orange-200", dot: "bg-orange-400", label: "Limité" },
  low: { pill: "bg-green-50 text-green-700 border border-green-200", dot: "bg-green-500", label: "Sans risque" },
};

function NutrientRow({ label, value, unit, warn }: { label: string; value: number | null; unit: string; warn?: boolean }) {
  if (value === null) return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-black/4 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${warn ? "text-orange-600" : "text-foreground"}`}>
        {value % 1 === 0 ? value : value.toFixed(1)} {unit}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-gray-400">{children}</p>;
}

export function ProductDetailSheet({ productId, recipeId, onClose, onReportPrice }: ProductDetailSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isDismissingRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setIsLoading(true);
    getProductDetails(productId).then((data) => {
      setProduct(data);
      setIsLoading(false);
    });
  }, [productId]);

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

  function handleReportPrice() {
    dismiss();
    setTimeout(onReportPrice, 310);
  }

  const off = product?.off ?? null;

  const additives = (off?.additiveTags ?? [])
    .map(parseAdditiveTag)
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .map((a) => ({ ...a, risk: getAdditiveRisk(a.code) }))
    .sort((a, b) => ({ high: 0, moderate: 1, low: 2 }[a.risk] - ({ high: 0, moderate: 1, low: 2 }[b.risk])));

  const allergens = (off?.allergenTags ?? [])
    .map((t) => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " "))
    .filter(Boolean);

  const labels = (off?.labelTags ?? [])
    .map((t) => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " "))
    .filter((l) => !l.startsWith("en:") && l.length > 2);

  if (!mounted) return null;

  return createPortal(
    <>
      <div ref={backdropRef} className="fixed inset-0 z-60 bg-black/40" onClick={dismiss} aria-hidden />
      <div ref={sheetRef} className="fixed bottom-0 left-0 right-0 z-61 flex max-h-[92vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl">
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
            <div className="flex items-center gap-4 px-5 pb-4 pt-1">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-20 w-20 shrink-0 rounded-2xl object-contain bg-gray-50 ring-1 ring-black/5" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-3xl ring-1 ring-black/5">🛒</div>
              )}
              <div className="flex min-w-0 flex-col gap-1">
                <h2 className="text-base font-bold leading-snug text-foreground">{product.name}</h2>
                {product.brand && <p className="text-xs text-gray-400">{product.brand}</p>}
                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {labels.slice(0, 3).map((l) => (
                      <span key={l} className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium capitalize text-green-700">
                        {l}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto px-5 pb-5 no-scrollbar">
              {product.nutriscoreGrade && (
                <div className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-gray-50 p-3 ring-1 ring-black/5">
                  <NutriScoreBadge grade={product.nutriscoreGrade} size="md" />
                  <span className="text-[10px] font-medium text-gray-400">Nutri-Score</span>
                </div>
              )}
              {product.ecoscoreGrade && ECOSCORE_BG[product.ecoscoreGrade.toLowerCase()] && (
                <div className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-gray-50 p-3 ring-1 ring-black/5">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded font-black text-white text-xs ${ECOSCORE_BG[product.ecoscoreGrade.toLowerCase()]}`}>
                    {product.ecoscoreGrade.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400">Éco-Score</span>
                </div>
              )}
              {product.novaGroup && NOVA_CONFIG[product.novaGroup] && (
                <>
                  <div className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl bg-gray-50 p-3 ring-1 ring-black/5">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded font-black text-white text-xs ${NOVA_CONFIG[product.novaGroup].bg}`}>
                      {product.novaGroup}
                    </span>
                    <span className="text-[10px] font-medium text-gray-400">Nova</span>
                  </div>
                  <div className="flex shrink-0 max-w-[190px] flex-col justify-center gap-0.5 rounded-2xl bg-gray-50 px-3 py-2.5 ring-1 ring-black/5">
                    <span className={`text-xs font-semibold ${NOVA_CONFIG[product.novaGroup].text}`}>{NOVA_CONFIG[product.novaGroup].label}</span>
                    <span className="text-[10px] leading-tight text-gray-400">{NOVA_CONFIG[product.novaGroup].desc}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-6 px-5 pb-10">
              {off?.nutriments && Object.values(off.nutriments).some((v) => v !== null) && (
                <div>
                  <div className="mb-3 flex items-baseline gap-2">
                    <SectionTitle><Trans>Nutritional values</Trans></SectionTitle>
                    <span className="mb-3 text-[10px] text-gray-400">pour 100g</span>
                  </div>
                  <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
                    <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-black/4">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Nutriment</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Pour 100g</span>
                    </div>
                    <div className="px-4">
                      <NutrientRow label="Énergie" value={off.nutriments.energyKcal} unit="kcal" />
                      <NutrientRow label="Matières grasses" value={off.nutriments.fat} unit="g" warn={(off.nutriments.fat ?? 0) > 20} />
                      <NutrientRow label="dont saturées" value={off.nutriments.saturatedFat} unit="g" warn={(off.nutriments.saturatedFat ?? 0) > 5} />
                      <NutrientRow label="Glucides" value={off.nutriments.carbohydrates} unit="g" />
                      <NutrientRow label="dont sucres" value={off.nutriments.sugars} unit="g" warn={(off.nutriments.sugars ?? 0) > 12} />
                      <NutrientRow label="Fibres" value={off.nutriments.fiber} unit="g" />
                      <NutrientRow label="Protéines" value={off.nutriments.proteins} unit="g" />
                      <NutrientRow label="Sel" value={off.nutriments.salt} unit="g" warn={(off.nutriments.salt ?? 0) > 1.5} />
                    </div>
                  </div>
                </div>
              )}

              {additives.length > 0 && (
                <div>
                  <div className="mb-3 flex items-baseline gap-2">
                    <SectionTitle><Trans>Additives</Trans></SectionTitle>
                    <span className="mb-3 text-[10px] text-gray-400">{additives.length} détecté{additives.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {(["high", "moderate", "low"] as const).map((risk) => {
                      const group = additives.filter((a) => a.risk === risk);
                      if (group.length === 0) return null;
                      const style = RISK_STYLE[risk];
                      return (
                        <div key={risk} className="overflow-hidden rounded-2xl ring-1 ring-black/5">
                          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 border-b border-black/4">
                            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                            <span className="text-xs font-semibold text-gray-600">{style.label}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 bg-white px-4 py-3">
                            {group.map((a) => (
                              <span key={a.code} className={`rounded-full px-2.5 py-1 text-xs font-medium ${style.pill}`}>
                                {a.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {allergens.length > 0 && (
                <div>
                  <SectionTitle><Trans>Allergens</Trans></SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {allergens.map((a) => (
                      <span key={a} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium capitalize text-amber-700 ring-1 ring-amber-200">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {off?.ingredientsText && (
                <div>
                  <SectionTitle><Trans>Ingredients</Trans></SectionTitle>
                  <p className="text-xs leading-relaxed text-gray-500">{off.ingredientsText}</p>
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <SectionTitle><Trans>Prices by store</Trans></SectionTitle>
                  <button
                    type="button"
                    onClick={handleReportPrice}
                    className="mb-3 flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <Trans>Reporter</Trans>
                  </button>
                </div>

                {product.prices.length === 0 ? (
                  <div className="rounded-2xl bg-gray-50 px-4 py-6 text-center ring-1 ring-black/5">
                    <p className="text-sm text-gray-400"><Trans>No prices yet — be the first to report one!</Trans></p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl ring-1 ring-black/5">
                    {product.prices.map((p, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-4 py-3 ${i < product.prices.length - 1 ? "border-b border-black/4" : ""} ${i === 0 ? "bg-green-50" : "bg-white"}`}
                      >
                        <div className="flex items-center gap-2">
                          {i === 0 && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                          <span className={`text-sm font-medium ${i === 0 ? "text-green-700" : "text-foreground"}`}>{p.storeName}</span>
                        </div>
                        <span className={`text-sm font-semibold ${i === 0 ? "text-green-700" : "text-gray-500"}`}>
                          {p.price.toFixed(2)} €
                          <span className="ml-1 text-xs font-normal text-gray-400">/ {p.quantity} {p.unit}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
