"use client";

import { useRef, useState, useEffect } from "react";
import { formatRelativeTime } from "@/shared/utils/formatRelativeTime";
import { BottomSheet, SheetHandle, type BottomSheetHandle } from "@/shared/components/ui/bottomSheet";
import {
  ProductDetailContent,
  computeScore, gradeFromScore,
  type ParsedAdditive,
} from "@/applications/catalog/ui/components/productDetailSheet";
import { getProductDetails } from "@/applications/catalog/application/useCases/getProductDetails";
import { getProductAlternatives } from "@/applications/catalog/application/useCases/getProductAlternatives";
import { getAdditiveRisk, parseAdditiveTag } from "@/applications/catalog/domain/additiveRisks";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";
import type { ShoppingItem } from "@/applications/shopping/domain/entities/shopping";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";
import type { ProductDetails } from "@/applications/catalog/application/useCases/getProductDetails";
import { Trans } from "@lingui/react/macro";

interface ItemDetailSheetProps {
  item: ShoppingItem;
  userStores: UserStoreItem[];
  activeStoreId?: string | null;
  onClose: () => void;
  onAddPrice: (store?: UserStoreItem) => void;
}

type Tab = "details" | "prix" | "alternatives";

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

export function ItemDetailSheet({ item, userStores, activeStoreId, onClose, onAddPrice }: ItemDetailSheetProps) {
  const bsRef = useRef<BottomSheetHandle>(null);
  const [tab, setTab] = useState<Tab>(item.productId ? "details" : "prix");
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(!!item.productId);
  const [alternatives, setAlternatives] = useState<OFFProduct[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);

  const qty = item.quantity % 1 === 0
    ? item.quantity
    : parseFloat(item.quantity.toFixed(2).replace(/\.?0+$/, ""));

  useEffect(() => {
    if (!item.productId) return;
    getProductDetails(item.productId).then((p) => {
      setProduct(p);
      setLoadingProduct(false);
      if (!p) return;
      const grade = p.nutriscoreGrade?.toLowerCase();
      if (!grade || grade === "a" || grade === "b") return;
      setLoadingAlts(true);
      getProductAlternatives(p.id).then(setAlternatives).finally(() => setLoadingAlts(false));
    });
  }, [item.productId]);

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

  const badNutriscore = product?.nutriscoreGrade && ["c", "d", "e"].includes(product.nutriscoreGrade.toLowerCase());
  const showAltsTab = !!item.productId && (loadingAlts || alternatives.length > 0 || !!badNutriscore);

  const cheapest = item.allStorePrices.length > 0
    ? item.allStorePrices.reduce((min, p) => p.estimatedCost < min.estimatedCost ? p : min)
    : null;
  const activeStorePrice = activeStoreId ? item.allStorePrices.find((p) => p.storeId === activeStoreId) : null;
  const savings = cheapest && activeStorePrice && activeStorePrice.storeId !== cheapest.storeId
    ? activeStorePrice.estimatedCost - cheapest.estimatedCost
    : 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: "details", label: "Détails" },
    { key: "prix", label: "Prix" },
    ...(showAltsTab ? [{ key: "alternatives" as Tab, label: "Alternatives" }] : []),
  ];

  return (
    <BottomSheet ref={bsRef} onClose={onClose} maxHeight="90vh">
      <SheetHandle>
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h3 className="text-base font-bold text-foreground">{item.customName}</h3>
            <p className="text-xs text-muted-foreground/60">{qty} {item.unit}</p>
          </div>
          <button
            type="button"
            onClick={() => bsRef.current?.dismiss()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex gap-0 border-b border-border/60 px-5">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`relative pb-3 pr-5 text-sm font-semibold transition ${
                tab === key ? "text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground"
              }`}
            >
              {label}
              {tab === key && (
                <span className="absolute bottom-0 left-0 right-5 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </SheetHandle>

      {tab === "details" && (
        loadingProduct ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <svg className="animate-spin text-muted-foreground/40" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : !product ? (
          <div className="flex flex-col items-center gap-4 px-5 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-muted">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Aucun produit lié</p>
              <p className="mt-1 text-xs text-muted-foreground/70 max-w-56">
                Ajoutez un prix depuis l'onglet Prix pour lier un produit et voir sa fiche nutritionnelle.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTab("prix")}
              className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition active:scale-95"
            >
              Voir les prix
            </button>
          </div>
        ) : (
          <ProductDetailContent
            product={product}
            additives={additives}
            allergens={allergens}
            highCount={highCount}
            score={score}
            grade={grade}
            alternatives={[]}
            hidePrices
          />
        )
      )}

      {tab === "prix" && (
        <div className="flex flex-col gap-3 overflow-y-auto px-5 pb-10 pt-4">
          <p className="text-[11px] text-muted-foreground/50">
            Estimation pour {qty} {item.unit} · Prix communautaires
          </p>

          {userStores.length === 0 ? (
            <div className="rounded-2xl bg-muted/40 px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground/70">Ajoutez des magasins dans votre profil pour comparer les prix.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {userStores.map((store) => {
                const sp = item.allStorePrices.find((p) => p.storeId === store.id);
                const isCheapest = cheapest?.storeId === store.id && item.allStorePrices.length > 1;
                const isActive = activeStoreId === store.id;
                return (
                  <div
                    key={store.id}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 ${
                      isActive ? "ring-2 ring-primary/30 bg-primary/5" : "bg-muted/40"
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${isCheapest ? "bg-green-100" : "bg-white"}`}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isCheapest ? "#16a34a" : "#9ca3af"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>{store.name}</p>
                      {isActive && <p className="text-[10px] text-primary/60 font-medium">Magasin actif</p>}
                      {isCheapest && !isActive && <p className="text-[10px] text-green-600 font-semibold">Le moins cher ✓</p>}
                      {sp && sp.reportedAt && (
                        <p className="text-[10px] text-muted-foreground/40">
                          {formatRelativeTime(sp.reportedAt)}
                          {sp.reporterCount > 1 && ` · ${sp.reporterCount} contributeurs`}
                        </p>
                      )}
                    </div>
                    {sp ? (
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className={`text-lg font-black ${isCheapest ? "text-green-600" : isActive ? "text-primary" : "text-foreground"}`}>
                          {sp.estimatedCost.toFixed(2)} €
                        </span>
                        {sp.confidence !== "exact" && (
                          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600">
                            {sp.confidence === "brand_city" ? "Moy. ville" : "Moy. nationale"}
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { bsRef.current?.dismiss(); onAddPrice(store); }}
                        className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition active:scale-95"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Ajouter
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {savings > 0 && cheapest && (
            <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <p className="text-sm text-green-800">
                <strong>{cheapest.storeName}</strong> est moins cher de <strong>~{savings.toFixed(2)} €</strong>
              </p>
            </div>
          )}

          {item.allStorePrices.length === 0 && userStores.length > 0 && (
            <button
              type="button"
              onClick={() => { bsRef.current?.dismiss(); onAddPrice(undefined); }}
              className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white transition active:scale-[0.98]"
            >
              <Trans>Ajouter un prix</Trans>
            </button>
          )}
        </div>
      )}

      {tab === "alternatives" && (
        <div className="flex flex-col gap-3 overflow-y-auto px-5 pb-10 pt-4">
          {loadingAlts ? (
            <>
              <p className="text-[11px] text-muted-foreground/50">Recherche d'alternatives…</p>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3.5">
                  <Skeleton className="h-12 w-12 shrink-0" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
                </div>
              ))}
            </>
          ) : alternatives.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-green-50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-foreground">Aucune alternative trouvée</p>
              <p className="text-xs text-muted-foreground/60">Pas de meilleure option connue dans cette catégorie.</p>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground/50">Meilleur Nutri-Score dans la même catégorie</p>
              <div className="overflow-hidden rounded-2xl bg-white">
                {alternatives.map((alt, i) => (
                  <div key={alt.offId} className={`flex items-center gap-3 px-4 py-3.5 ${i < alternatives.length - 1 ? "border-b border-black/4" : ""}`}>
                    {alt.imageUrl ? (
                      <img src={alt.imageUrl} alt={alt.name} className="h-10 w-10 shrink-0 rounded-xl bg-muted object-contain" />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{alt.name}</p>
                      {alt.brand && <p className="truncate text-xs text-muted-foreground">{alt.brand}</p>}
                    </div>
                    {alt.nutriscoreGrade && (
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white"
                        style={{ backgroundColor: { a: "#16A34A", b: "#65A30D", c: "#CA8A04", d: "#EA580C", e: "#DC2626" }[alt.nutriscoreGrade] ?? "#9CA3AF" }}
                      >
                        {alt.nutriscoreGrade.toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
