"use client";

import { useState, useRef, useEffect } from "react";
import { Trans } from "@lingui/react/macro";
import { getProductDetails, type ProductDetails } from "@/applications/catalog/application/useCases/getProductDetails";
import { getProductAlternatives } from "@/applications/catalog/application/useCases/getProductAlternatives";
import { getProductPriceHistory, type PriceHistoryPoint } from "@/applications/catalog/application/useCases/getProductPriceHistory";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getAdditiveRisk, parseAdditiveTag } from "@/applications/catalog/domain/additiveRisks";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";
import { BottomSheet, SheetHandle, type BottomSheetHandle } from "@/shared/components/ui/bottomSheet";

export { type ProductDetails };

export const NUTRI_SCORE_MAP: Record<string, number> = { a: 100, b: 75, c: 50, d: 25, e: 0 };
export const NOVA_SCORE_MAP: Record<number, number> = { 1: 100, 2: 75, 3: 25, 4: 0 };

export const NOVA_LABEL: Record<number, string> = {
  1: "Peu transformé", 2: "Ingrédient culinaire", 3: "Transformé", 4: "Ultra-transformé",
};
export const RISK_COLOR: Record<string, string> = {
  high: "#EF4444", moderate: "#F97316", low: "#22C55E",
};
export const RISK_LABEL: Record<string, string> = {
  high: "À éviter", moderate: "Limité", low: "OK",
};
export const RISK_BG: Record<string, string> = {
  high: "bg-red-50 text-red-700", moderate: "bg-orange-50 text-orange-600", low: "bg-green-50 text-green-700",
};
export const NUTRI_COLOR: Record<string, string> = {
  a: "#16A34A", b: "#65A30D", c: "#CA8A04", d: "#EA580C", e: "#DC2626",
};
export const NOVA_COLOR: Record<number, string> = {
  1: "#16A34A", 2: "#65A30D", 3: "#EA580C", 4: "#DC2626",
};

export function computeScore(product: ProductDetails, highCount: number): number {
  const ns = product.nutriscoreGrade ? NUTRI_SCORE_MAP[product.nutriscoreGrade.toLowerCase()] : null;
  const nv = product.novaGroup ? NOVA_SCORE_MAP[product.novaGroup] : null;
  const as_ = highCount > 0 ? 0 : 100;
  const parts: { v: number; w: number }[] = [];
  if (ns != null) parts.push({ v: ns, w: 0.6 });
  if (nv != null) parts.push({ v: nv, w: 0.3 });
  parts.push({ v: as_, w: 0.1 });
  const tw = parts.reduce((s, p) => s + p.w, 0);
  return Math.round(parts.reduce((s, p) => s + p.v * p.w, 0) / tw);
}

export function gradeFromScore(score: number) {
  if (score >= 75) return { label: "Excellent", color: "#16A34A" };
  if (score >= 50) return { label: "Bon", color: "#65A30D" };
  if (score >= 25) return { label: "Médiocre", color: "#EA580C" };
  return { label: "Mauvais", color: "#DC2626" };
}

export type ParsedAdditive = { name: string; code: string; risk: "high" | "moderate" | "low" };

export interface ProductDetailContentProps {
  product: ProductDetails;
  additives: ParsedAdditive[];
  allergens: string[];
  highCount: number;
  score: number;
  grade: { label: string; color: string };
  alternatives: OFFProduct[];
  priceHistory?: PriceHistoryPoint[];
  onReportPrice?: () => void;
  hidePrices?: boolean;
}

export function ProductDetailContent({
  product, additives, allergens, highCount, score, grade,
  alternatives, priceHistory = [], onReportPrice, hidePrices,
}: ProductDetailContentProps) {
  const off = product.off ?? null;
  const r = 52, circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75;
  const progressLen = arcLen * (score / 100);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex items-center gap-4 px-5 py-4">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-16 w-16 shrink-0 rounded-2xl bg-muted object-contain" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold leading-snug text-foreground">{product.name}</h2>
          {product.brand && <p className="mt-0.5 text-sm text-muted-foreground">{product.brand}</p>}
        </div>
      </div>

      <div className="mx-4 mb-4 rounded-2xl bg-muted/60">
        <div className="flex items-center gap-5 px-5 py-5">
          <div className="relative shrink-0" style={{ filter: `drop-shadow(0 0 12px ${grade.color}44)` }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={r} fill="none" stroke={`${grade.color}1a`} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${arcLen} ${circ - arcLen}`} transform="rotate(135 60 60)" />
              <circle cx="60" cy="60" r={r} fill="none" stroke={grade.color} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${progressLen} ${circ - progressLen}`} transform="rotate(135 60 60)" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black leading-none tabular-nums" style={{ color: grade.color }}>{score}</span>
              <span className="text-[10px] font-medium text-muted-foreground">/100</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div>
              <p className="text-lg font-bold leading-tight" style={{ color: grade.color }}>{grade.label}</p>
              <p className="text-xs text-muted-foreground">Score santé global</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                  </svg>
                  <span className="text-xs text-muted-foreground">Nutrition</span>
                </div>
                {product.nutriscoreGrade ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black text-white"
                    style={{ backgroundColor: NUTRI_COLOR[product.nutriscoreGrade.toLowerCase()] ?? "#9CA3AF" }}>
                    {product.nutriscoreGrade.toUpperCase()}
                  </span>
                ) : <span className="text-xs text-muted-foreground">—</span>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M9 2v8.5L5.5 17a4 4 0 0 0 13 0L15 10.5V2" /><path d="M9 2h6" />
                  </svg>
                  <span className="text-xs text-muted-foreground">Additifs</span>
                </div>
                {additives.length === 0 ? (
                  <span className="text-xs font-semibold text-green-600">Aucun</span>
                ) : highCount > 0 ? (
                  <span className="text-xs font-semibold text-red-600">{highCount} à éviter</span>
                ) : (
                  <span className="text-xs font-semibold text-orange-500">{additives.length} limité{additives.length > 1 ? "s" : ""}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
                  </svg>
                  <span className="text-xs text-muted-foreground">Transformation</span>
                </div>
                {product.novaGroup ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black text-white"
                    style={{ backgroundColor: NOVA_COLOR[product.novaGroup] ?? "#9CA3AF" }}>
                    {product.novaGroup}
                  </span>
                ) : <span className="text-xs text-muted-foreground">—</span>}
              </div>
            </div>
          </div>
        </div>

        {product.novaGroup && (
          <div className="border-t border-border/60 px-5 py-2.5">
            <span className="text-xs text-muted-foreground">{NOVA_LABEL[product.novaGroup]}</span>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="overflow-hidden rounded-2xl bg-white">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M9 2v8.5L5.5 17a4 4 0 0 0 13 0L15 10.5V2" /><path d="M9 2h6" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Additifs</span>
            {additives.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">{additives.length} détecté{additives.length > 1 ? "s" : ""}</span>
            )}
          </div>

          {additives.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="text-sm font-medium text-green-700">Aucun additif détecté</span>
            </div>
          ) : (
            additives.map((a, i) => (
              <div key={a.code} className={`flex items-center gap-3 px-4 py-3.5 ${i < additives.length - 1 ? "border-b border-black/4" : ""}`}>
                <div className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: RISK_COLOR[a.risk] }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                  <p className="text-[11px] font-bold uppercase text-muted-foreground">{a.code}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${RISK_BG[a.risk]}`}>
                  {RISK_LABEL[a.risk]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {allergens.length > 0 && (
        <div className="px-4 pb-4">
          <div className="overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Allergènes</span>
            </div>
            <div className="flex flex-wrap gap-2 px-4 py-3.5">
              {allergens.map((a) => (
                <span key={a} className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold capitalize text-amber-700 ring-1 ring-amber-200">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {off?.nutriments && Object.values(off.nutriments).some((v) => v !== null) && (
        <div className="px-4 pb-4">
          <div className="overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Valeurs nutritionnelles</span>
              <span className="ml-auto text-xs text-muted-foreground">/ 100g</span>
            </div>
            {([
              { label: "Énergie",       v: off.nutriments.energyKcal,    unit: "kcal", sub: false, warn: false },
              { label: "Graisses",       v: off.nutriments.fat,           unit: "g",    sub: false, warn: (off.nutriments.fat ?? 0) > 20 },
              { label: "dont saturées",  v: off.nutriments.saturatedFat,  unit: "g",    sub: true,  warn: (off.nutriments.saturatedFat ?? 0) > 5 },
              { label: "Glucides",       v: off.nutriments.carbohydrates, unit: "g",    sub: false, warn: false },
              { label: "dont sucres",    v: off.nutriments.sugars,        unit: "g",    sub: true,  warn: (off.nutriments.sugars ?? 0) > 12 },
              { label: "Fibres",         v: off.nutriments.fiber,         unit: "g",    sub: false, warn: false },
              { label: "Protéines",      v: off.nutriments.proteins,      unit: "g",    sub: false, warn: false },
              { label: "Sel",            v: off.nutriments.salt,          unit: "g",    sub: false, warn: (off.nutriments.salt ?? 0) > 1.5 },
            ] as const).filter((row) => row.v !== null).map((row, i, arr) => (
              <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? "border-b border-black/4" : ""}`}>
                <span className={`text-sm ${row.sub ? "pl-3 text-muted-foreground" : "font-medium text-foreground"}`}>{row.label}</span>
                <span className={`text-sm font-semibold ${row.warn ? "text-orange-500" : "text-foreground"}`}>
                  {typeof row.v === "number" ? (row.v % 1 === 0 ? row.v : row.v.toFixed(1)) : row.v} {row.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {off?.ingredientsText && (
        <div className="px-4 pb-4">
          <div className="overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ingrédients</span>
            </div>
            <p className="px-4 py-3.5 text-xs leading-relaxed text-muted-foreground">{off.ingredientsText}</p>
          </div>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="px-4 pb-4">
          <div className="overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Alternatives plus saines</span>
            </div>
            {alternatives.map((alt, i) => (
              <div key={alt.offId} className={`flex items-center gap-3 px-4 py-3.5 ${i < alternatives.length - 1 ? "border-b border-black/4" : ""}`}>
                {alt.imageUrl ? (
                  <img src={alt.imageUrl} alt={alt.name} className="h-10 w-10 shrink-0 rounded-xl bg-muted object-contain" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
                      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{alt.name}</p>
                  {alt.brand && <p className="truncate text-xs text-muted-foreground">{alt.brand}</p>}
                </div>
                {alt.nutriscoreGrade && (
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white"
                    style={{ backgroundColor: NUTRI_COLOR[alt.nutriscoreGrade] ?? "#9CA3AF" }}
                  >
                    {alt.nutriscoreGrade.toUpperCase()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hidePrices && (
        <div className="px-4 pb-4">
          <div className="overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prix en magasin</span>
              {onReportPrice && (
                <button
                  type="button"
                  onClick={onReportPrice}
                  className="ml-auto flex items-center gap-1 text-xs font-semibold text-primary transition active:opacity-70"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <Trans>Reporter</Trans>
                </button>
              )}
            </div>

            {product.prices.length === 0 ? (
              <p className="px-4 py-3.5 text-sm text-muted-foreground">
                <Trans>No prices yet — be the first to report one!</Trans>
              </p>
            ) : (
              product.prices.map((p, i) => (
                <div key={i} className={`flex items-center justify-between px-4 py-3.5 ${i < product.prices.length - 1 ? "border-b border-black/4" : ""}`}>
                  <div className="flex items-center gap-2.5">
                    {i === 0 && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    <span className={`text-sm ${i === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {p.storeName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${i === 0 ? "text-primary" : "text-foreground"}`}>
                      {p.price.toFixed(2)} €
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">/ {p.quantity} {p.unit}</span>
                  </div>
                </div>
              ))
            )}

            {priceHistory.length > 1 && (
              <div className="border-t border-black/4 px-4 pb-4 pt-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Historique</p>
                <ResponsiveContainer width="100%" height={80}>
                  <AreaChart data={priceHistory} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis hide domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, padding: "4px 8px", borderRadius: 8, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
                      formatter={(v) => [typeof v === "number" ? `${v.toFixed(2)} €` : v, ""]}
                      labelStyle={{ display: "none" }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#16a34a" strokeWidth={2} fill="url(#priceGrad)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}

interface ProductDetailSheetProps {
  productId: string;
  recipeId: string;
  onClose: () => void;
  onReportPrice: () => void;
}

export function ProductDetailSheet({ productId, recipeId: _recipeId, onClose, onReportPrice }: ProductDetailSheetProps) {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alternatives, setAlternatives] = useState<OFFProduct[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const bsRef = useRef<BottomSheetHandle>(null);

  useEffect(() => {
    setIsLoading(true);
    setAlternatives([]);
    setPriceHistory([]);
    getProductDetails(productId).then((d) => { setProduct(d); setIsLoading(false); });
    getProductPriceHistory(productId).then(setPriceHistory);
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    const grade = product.nutriscoreGrade?.toLowerCase();
    if (!grade || grade === "a" || grade === "b") return;
    getProductAlternatives(product.id).then(setAlternatives);
  }, [product?.id, product?.nutriscoreGrade]);

  const off = product?.off ?? null;
  const additives: ParsedAdditive[] = (off?.additiveTags ?? [])
    .map(parseAdditiveTag).filter((a): a is NonNullable<typeof a> => a !== null)
    .map((a) => ({ ...a, risk: getAdditiveRisk(a.code) }))
    .sort((a, b) => ({ high: 0, moderate: 1, low: 2 }[a.risk] - ({ high: 0, moderate: 1, low: 2 }[b.risk])));
  const allergens = (off?.allergenTags ?? [])
    .map((t) => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " ")).filter(Boolean);
  const highCount = additives.filter((a) => a.risk === "high").length;
  const score = product ? computeScore(product, highCount) : 0;
  const grade = gradeFromScore(score);

  return (
    <BottomSheet ref={bsRef} onClose={onClose} maxHeight="92vh">
      <SheetHandle />

      {isLoading || !product ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <svg className="animate-spin text-muted-foreground/40" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
      ) : (
        <ProductDetailContent
          product={product}
          additives={additives}
          allergens={allergens}
          highCount={highCount}
          score={score}
          grade={grade}
          alternatives={alternatives}
          priceHistory={priceHistory}
          onReportPrice={() => { bsRef.current?.dismiss(); setTimeout(onReportPrice, 310); }}
        />
      )}
    </BottomSheet>
  );
}
