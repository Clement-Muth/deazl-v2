"use client";

import { useRef, useState, useEffect } from "react";
import { Trans } from "@lingui/react/macro";
import { BottomSheet, SheetHandle, type BottomSheetHandle } from "@/shared/components/ui/bottomSheet";
import { getProductDetails, type ProductDetails } from "@/applications/catalog/application/useCases/getProductDetails";
import { getAlternativesByOffId } from "@/applications/catalog/application/useCases/getAlternativesByOffId";
import type { OFFProduct } from "@/applications/catalog/domain/entities/catalog";
import type { ShoppingItem } from "@/applications/shopping/domain/entities/shopping";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";

interface ItemDetailSheetProps {
  item: ShoppingItem;
  userStores: UserStoreItem[];
  activeStoreId?: string | null;
  onClose: () => void;
  onAddPrice: (store?: UserStoreItem) => void;
}

const NS_GRADES = ["a", "b", "c", "d", "e"];
const NS_COLORS = ["#1a9c3e", "#56c948", "#dba800", "#e07823", "#e63e11"];
const NS_HEIGHTS = [26, 30, 34, 38, 42];

function NutriscoreScale({ grade }: { grade: string }) {
  const g = grade.toLowerCase();
  const activeIdx = NS_GRADES.indexOf(g);
  return (
    <div className="flex items-end gap-1.5">
      {NS_GRADES.map((gr, i) => {
        const isActive = i === activeIdx;
        return (
          <div
            key={gr}
            className="flex items-center justify-center rounded-lg"
            style={{
              width: isActive ? 42 : 30,
              height: NS_HEIGHTS[i],
              backgroundColor: isActive ? NS_COLORS[i] : `${NS_COLORS[i]}28`,
              transform: isActive ? "translateY(-3px)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            <span
              className="font-black uppercase"
              style={{ fontSize: isActive ? 15 : 10, color: isActive ? "white" : NS_COLORS[i] }}
            >
              {gr}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ScorePill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl px-2.5 py-1.5" style={{ backgroundColor: `${color}18` }}>
      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>{label}</span>
      <span className="text-sm font-black uppercase" style={{ color }}>{value}</span>
    </div>
  );
}

function NovaPill({ group }: { group: number }) {
  const colors = ["", "#1a9c3e", "#dba800", "#e07823", "#e63e11"];
  const labels = ["", "Non transformé", "Ingrédient culinaire", "Transformé", "Ultra-transformé"];
  const color = colors[group] ?? "#9ca3af";
  return (
    <div className="flex flex-col items-center rounded-xl px-2.5 py-1.5" style={{ backgroundColor: `${color}18` }}>
      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>NOVA</span>
      <span className="text-sm font-black" style={{ color }}>{group}</span>
    </div>
  );
}

interface NutrimentRowProps { label: string; value: number | null; unit: string; low: number; high: number; reverse?: boolean }
function NutrimentRow({ label, value, unit, low, high, reverse }: NutrimentRowProps) {
  if (value === null || value === undefined) return null;
  const pct = Math.min(value / high, 1);
  const isLow = value <= low;
  const isHigh = value >= high;
  const color = reverse
    ? isHigh ? "#1a9c3e" : isLow ? "#e63e11" : "#e07823"
    : isLow ? "#1a9c3e" : isHigh ? "#e63e11" : "#e07823";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/40 last:border-0">
      <span className="w-36 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
      </div>
      <span className="w-14 shrink-0 text-right text-xs font-semibold text-foreground">
        {value < 0.1 ? "<0.1" : value.toFixed(value < 10 ? 1 : 0)} {unit}
      </span>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

type Tab = "details" | "prix" | "alternatives";

export function ItemDetailSheet({ item, userStores, activeStoreId, onClose, onAddPrice }: ItemDetailSheetProps) {
  const bsRef = useRef<BottomSheetHandle>(null);
  const [tab, setTab] = useState<Tab>(item.productId ? "details" : "prix");
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(!!item.productId);
  const [alts, setAlts] = useState<OFFProduct[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);

  const qty = item.quantity % 1 === 0
    ? item.quantity
    : parseFloat(item.quantity.toFixed(2).replace(/\.?0+$/, ""));

  useEffect(() => {
    if (!item.productId) return;
    getProductDetails(item.productId).then((p) => {
      setProduct(p);
      setLoadingProduct(false);
      if (!p?.off?.offId || !p.nutriscoreGrade) return;
      if (!["c", "d", "e"].includes(p.nutriscoreGrade.toLowerCase())) return;
      setLoadingAlts(true);
      getAlternativesByOffId(p.off.offId, p.nutriscoreGrade)
        .then(setAlts)
        .finally(() => setLoadingAlts(false));
    });
  }, [item.productId]);

  const hasProduct = !!item.productId;
  const badNutriscore = product?.nutriscoreGrade && ["c", "d", "e"].includes(product.nutriscoreGrade.toLowerCase());
  const showAltsTab = hasProduct && (loadingAlts || alts.length > 0 || badNutriscore);

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
        <div className="flex items-start gap-4 px-5 py-4">
          {loadingProduct ? (
            <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
          ) : product?.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-16 w-16 shrink-0 rounded-2xl object-contain bg-muted/40 p-1"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/8">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            {loadingProduct ? (
              <div className="flex flex-col gap-2 pt-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ) : (
              <>
                <p className="text-base font-bold leading-tight text-foreground line-clamp-2">
                  {product?.name ?? item.customName}
                </p>
                {product?.brand && (
                  <p className="mt-0.5 text-xs text-muted-foreground/70">{product.brand}</p>
                )}
                {!hasProduct && (
                  <p className="mt-0.5 text-xs text-muted-foreground/60">{qty} {item.unit}</p>
                )}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  {product?.nutriscoreGrade && (
                    <ScorePill label="Nutri" value={product.nutriscoreGrade.toUpperCase()} color={NS_COLORS[NS_GRADES.indexOf(product.nutriscoreGrade.toLowerCase())] ?? "#9ca3af"} />
                  )}
                  {product?.ecoscoreGrade && (
                    <ScorePill label="Eco" value={product.ecoscoreGrade.toUpperCase()} color="#2d7d46" />
                  )}
                  {product?.novaGroup && (
                    <NovaPill group={product.novaGroup} />
                  )}
                  {!hasProduct && (
                    <span className="rounded-xl bg-muted px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground/60">
                      Sans produit lié
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => bsRef.current?.dismiss()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
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

      <div className="overflow-y-auto px-5 pb-10 pt-4">
        {tab === "details" && (
          <DetailsTab product={product} loading={loadingProduct} hasProduct={hasProduct} item={item} qty={qty} />
        )}
        {tab === "prix" && (
          <PrixTab
            item={item}
            userStores={userStores}
            activeStoreId={activeStoreId}
            cheapest={cheapest}
            savings={savings}
            onAddPrice={(store) => { bsRef.current?.dismiss(); onAddPrice(store); }}
            qty={qty}
          />
        )}
        {tab === "alternatives" && (
          <AlternativesTab alts={alts} loading={loadingAlts} currentGrade={product?.nutriscoreGrade ?? null} />
        )}
      </div>
    </BottomSheet>
  );
}

function DetailsTab({ product, loading, hasProduct, item, qty }: {
  product: ProductDetails | null; loading: boolean; hasProduct: boolean;
  item: ShoppingItem; qty: number;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-5 w-1/2" />
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }

  if (!hasProduct || !product) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
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
      </div>
    );
  }

  const n = product.off?.nutriments;

  return (
    <div className="flex flex-col gap-5">
      {product.nutriscoreGrade && (
        <div className="flex flex-col gap-3 rounded-2xl bg-muted/40 px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground/60">Score nutritionnel</p>
          <NutriscoreScale grade={product.nutriscoreGrade} />
          <p className="text-[11px] text-muted-foreground/50">
            {product.nutriscoreGrade.toLowerCase() === "a" && "Excellente qualité nutritionnelle"}
            {product.nutriscoreGrade.toLowerCase() === "b" && "Bonne qualité nutritionnelle"}
            {product.nutriscoreGrade.toLowerCase() === "c" && "Qualité nutritionnelle moyenne"}
            {product.nutriscoreGrade.toLowerCase() === "d" && "Qualité nutritionnelle médiocre"}
            {product.nutriscoreGrade.toLowerCase() === "e" && "Mauvaise qualité nutritionnelle"}
          </p>
        </div>
      )}

      {n && (
        <div className="flex flex-col rounded-2xl overflow-hidden border border-border/50">
          <div className="bg-muted/40 px-4 py-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground/60">Pour 100g / 100ml</p>
          </div>
          {n.energyKcal !== null && (
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
              <span className="text-xs text-muted-foreground">Énergie</span>
              <span className="text-xs font-semibold text-foreground">{n.energyKcal?.toFixed(0)} kcal</span>
            </div>
          )}
          <div className="px-4 py-1">
            <NutrimentRow label="Matières grasses" value={n.fat} unit="g" low={3} high={20} />
            <NutrimentRow label="dont saturées" value={n.saturatedFat} unit="g" low={1.5} high={5} />
            <NutrimentRow label="Glucides" value={n.carbohydrates} unit="g" low={10} high={45} />
            <NutrimentRow label="dont sucres" value={n.sugars} unit="g" low={5} high={15} />
            <NutrimentRow label="Fibres" value={n.fiber} unit="g" low={3} high={9} reverse />
            <NutrimentRow label="Protéines" value={n.proteins} unit="g" low={5} high={20} reverse />
            <NutrimentRow label="Sel" value={n.salt} unit="g" low={0.3} high={1.5} />
          </div>
        </div>
      )}

      {product.off?.additiveTags && product.off.additiveTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground/60">Additifs ({product.off.additiveTags.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {product.off.additiveTags.map((a) => (
              <span key={a} className="rounded-lg bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
                {a.replace("en:", "").toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {product.off?.allergenTags && product.off.allergenTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground/60">Allergènes</p>
          <div className="flex flex-wrap gap-1.5">
            {product.off.allergenTags.map((a) => (
              <span key={a} className="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                {a.replace("en:", "").replace(/-/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {product.off?.labelTags && product.off.labelTags.filter(l => l.includes("organic") || l.includes("bio") || l.includes("fair")).length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground/60">Labels</p>
          <div className="flex flex-wrap gap-1.5">
            {product.off.labelTags.filter(l => l.includes("organic") || l.includes("bio") || l.includes("fair")).map((l) => (
              <span key={l} className="rounded-lg bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                {l.replace("en:", "").replace(/-/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {product.off?.ingredientsText && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground/60">Ingrédients</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{product.off.ingredientsText}</p>
        </div>
      )}
    </div>
  );
}

function PrixTab({ item, userStores, activeStoreId, cheapest, savings, onAddPrice, qty }: {
  item: ShoppingItem; userStores: UserStoreItem[]; activeStoreId?: string | null;
  cheapest: { storeId: string; storeName: string; estimatedCost: number } | null;
  savings: number; onAddPrice: (store?: UserStoreItem) => void; qty: number;
}) {
  return (
    <div className="flex flex-col gap-3">
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
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isCheapest ? "bg-green-100" : "bg-white"} shadow-sm`}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isCheapest ? "#16a34a" : "#9ca3af"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>{store.name}</p>
                  {isActive && <p className="text-[10px] text-primary/60 font-medium">Magasin actif</p>}
                  {isCheapest && !isActive && <p className="text-[10px] text-green-600 font-semibold">Le moins cher ✓</p>}
                </div>
                {sp ? (
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-lg font-black ${isCheapest ? "text-green-600" : isActive ? "text-primary" : "text-foreground"}`}>
                      {sp.estimatedCost.toFixed(2)} €
                    </span>
                    {isCheapest && <span className="text-[10px] text-green-600 font-medium">~</span>}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAddPrice(store)}
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
            <strong>{cheapest.storeName}</strong> est moins cher de <strong>~{savings.toFixed(2)} €</strong> pour cet article
          </p>
        </div>
      )}

      {item.allStorePrices.length === 0 && userStores.length > 0 && (
        <button
          type="button"
          onClick={() => onAddPrice(undefined)}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white transition active:scale-[0.98]"
        >
          Ajouter un prix
        </button>
      )}
    </div>
  );
}

function AlternativesTab({ alts, loading, currentGrade }: {
  alts: OFFProduct[]; loading: boolean; currentGrade: string | null;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[11px] text-muted-foreground/50">Recherche de meilleures alternatives…</p>
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
      </div>
    );
  }

  if (alts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-green-50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-foreground">Aucune alternative trouvée</p>
        <p className="text-xs text-muted-foreground/60">Pas de meilleure option connue dans cette catégorie.</p>
      </div>
    );
  }

  const currentIdx = currentGrade ? NS_GRADES.indexOf(currentGrade.toLowerCase()) : -1;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] text-muted-foreground/50">
        Produits avec un meilleur Nutri-Score dans la même catégorie
      </p>
      {alts.map((alt) => {
        const altIdx = alt.nutriscoreGrade ? NS_GRADES.indexOf(alt.nutriscoreGrade.toLowerCase()) : -1;
        const improvement = currentIdx - altIdx;
        return (
          <div key={alt.offId} className="flex items-center gap-3 rounded-2xl bg-muted/40 px-4 py-3.5">
            {alt.imageUrl ? (
              <img src={alt.imageUrl} alt={alt.name} className="h-12 w-12 shrink-0 rounded-xl object-contain bg-white p-1" />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-xl bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{alt.name}</p>
              {alt.brand && <p className="text-xs text-muted-foreground/60">{alt.brand}</p>}
              {improvement > 0 && (
                <p className="text-[10px] font-semibold text-green-600">
                  +{improvement} grade{improvement > 1 ? "s" : ""} de mieux
                </p>
              )}
            </div>
            {alt.nutriscoreGrade && (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black uppercase text-white text-sm"
                style={{ backgroundColor: NS_COLORS[NS_GRADES.indexOf(alt.nutriscoreGrade.toLowerCase())] ?? "#9ca3af" }}
              >
                {alt.nutriscoreGrade.toUpperCase()}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
