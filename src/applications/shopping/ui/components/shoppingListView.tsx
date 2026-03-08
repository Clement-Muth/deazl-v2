"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trans } from "@lingui/react/macro";
import { toggleShoppingItem } from "@/applications/shopping/application/useCases/toggleShoppingItem";
import { clearCheckedItems } from "@/applications/shopping/application/useCases/clearCheckedItems";
import { deleteShoppingItem } from "@/applications/shopping/application/useCases/deleteShoppingItem";
import { transferCheckedToPantry } from "@/applications/shopping/application/useCases/transferCheckedToPantry";
import { ShoppingItemRow } from "./shoppingItemRow";
import { AddItemForm } from "./addItemForm";
import { ActiveStoreSelector } from "./activeStoreSelector";
import { IngredientPriceSheet } from "./ingredientPriceSheet";
import { ItemDetailSheet } from "./itemDetailSheet";
import { useActiveStore } from "../hooks/useActiveStore";
import type { ShoppingItem, ShoppingList, StoreCostSummary } from "@/applications/shopping/domain/entities/shopping";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";

interface ShoppingListViewProps {
  list: ShoppingList;
}

const CATEGORY_ORDER = [
  "Fruits & Légumes",
  "Viandes & Poissons",
  "Produits laitiers",
  "Boulangerie",
  "Épicerie sèche",
  "Surgelés",
  "Boissons",
  "Hygiène & Beauté",
  "Entretien",
  "Autre",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Fruits & Légumes": "#22c55e",
  "Viandes & Poissons": "#ef4444",
  "Produits laitiers": "#3b82f6",
  "Boulangerie": "#f97316",
  "Épicerie sèche": "#f59e0b",
  "Surgelés": "#06b6d4",
  "Boissons": "#8b5cf6",
  "Hygiène & Beauté": "#ec4899",
  "Entretien": "#64748b",
  "Autre": "#9ca3af",
};

function CategorySection({
  category,
  items,
  isOpen,
  onToggle,
  onToggleItem,
  onDelete,
  onReportPrice,
  onDetail,
  activeStoreId,
  isStoreMode,
  animationDelay = 0,
}: {
  category: string;
  items: ShoppingItem[];
  isOpen: boolean;
  onToggle: () => void;
  onToggleItem: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  onReportPrice?: (item: ShoppingItem) => void;
  onDetail?: (item: ShoppingItem) => void;
  activeStoreId?: string | null;
  isStoreMode?: boolean;
  animationDelay?: number;
}) {
  const color = CATEGORY_COLORS[category] ?? "#9ca3af";

  return (
    <div
      className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]"
      style={{ animation: `fadeSlideUp 0.35s ${animationDelay}ms cubic-bezier(0.22,1,0.36,1) both` }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-4 py-3"
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="flex-1 text-left text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {category}
        </span>
        <span className="text-xs font-medium text-muted-foreground/40">{items.length}</span>
        {!isStoreMode && (
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)", flexShrink: 0 }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          transition: "grid-template-rows 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/60">
            {items.map((item, i) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                onDelete={onDelete}
                onReportPrice={onReportPrice}
                onDetail={onDetail}
                activeStoreId={activeStoreId}
                isStoreMode={isStoreMode}
                hasDivider={i < items.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreBanner({ summaries, activeStoreId }: { summaries: StoreCostSummary[]; activeStoreId?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  if (summaries.length === 0) return null;

  const cheapest = summaries[0];
  const activeSummary = activeStoreId ? summaries.find((s) => s.storeId === activeStoreId) : null;
  const featured = activeSummary ?? cheapest;
  const isActiveStoreCheapest = activeSummary ? activeSummary.storeId === cheapest.storeId : true;
  const savings = activeSummary && !isActiveStoreCheapest ? activeSummary.totalCost - cheapest.totalCost : 0;
  const others = summaries.filter((s) => s.storeId !== featured.storeId);

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 px-4 py-3.5"
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isActiveStoreCheapest ? "bg-green-500/10" : "bg-amber-50"}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActiveStoreCheapest ? "#22c55e" : "#f59e0b"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {isActiveStoreCheapest
              ? <polyline points="20 6 9 17 4 12" />
              : <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>
            }
          </svg>
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs font-medium text-muted-foreground/60"><Trans>Panier estimé</Trans></p>
          <p className="text-sm font-bold text-gray-800">
            {featured.storeName}
            {savings > 0 && <span className="ml-1.5 text-xs font-semibold text-amber-500">+{savings.toFixed(2)} €</span>}
            {isActiveStoreCheapest && activeSummary && <span className="ml-1.5 text-xs font-semibold text-green-600">✓ moins cher</span>}
          </p>
          <p className="text-[11px] text-muted-foreground/50">
            <Trans>basé sur {featured.coveredCount}/{featured.totalCount} articles</Trans>
          </p>
        </div>
        <p className={`text-base font-black ${isActiveStoreCheapest ? "text-green-600" : "text-amber-500"}`}>
          ~{featured.totalCost.toFixed(2)} €
        </p>
        {others.length > 0 && (
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s ease", flexShrink: 0 }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {others.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateRows: expanded ? "1fr" : "0fr",
            transition: "grid-template-rows 0.28s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div className="overflow-hidden">
            <div className="border-t border-border/60 px-5 py-3">
              {!isActiveStoreCheapest && (
                <p className="mb-2 text-[10px] font-semibold text-green-500">
                  <Trans>Save {savings.toFixed(2)} € by going to {cheapest.storeName.split(" ")[0]}</Trans>
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {others.map((s) => (
                  <div key={s.storeId} className="flex items-baseline gap-1.5">
                    <span className={`text-xs font-medium ${s.storeId === cheapest.storeId ? "text-green-600" : "text-muted-foreground"}`}>
                      {s.storeName.split(" ")[0]}
                    </span>
                    <span className="text-xs text-muted-foreground/70">~{s.totalCost.toFixed(2)} €</span>
                    {s.storeId === cheapest.storeId && !isActiveStoreCheapest && (
                      <span className="text-[10px] font-semibold text-green-500">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CONFETTI_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

function CompletionState() {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const dist = 60 + Math.random() * 40;
    const dx = Math.round(Math.cos((angle * Math.PI) / 180) * dist);
    const dy = Math.round(Math.sin((angle * Math.PI) / 180) * dist);
    return { dx, dy, rot: Math.round(Math.random() * 360), color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] };
  });

  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{
              backgroundColor: p.color,
              animation: `confetti 0.7s ${i * 40}ms ease-out forwards`,
              ["--dx" as string]: `${p.dx}px`,
              ["--dy" as string]: `${p.dy}px`,
              ["--rot" as string]: `${p.rot}deg`,
            }}
          />
        ))}
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500"
          style={{ animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: "drawCheck 0.35s 0.1s ease forwards" }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>
      <div>
        <p className="text-base font-bold text-foreground"><Trans>All done!</Trans></p>
        <p className="text-sm text-muted-foreground/70"><Trans>Time to checkout.</Trans></p>
      </div>
      <style>{`
        @keyframes confetti {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0); opacity: 0; }
        }
        @keyframes popIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 30; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

function UndoToast({ itemName, onUndo, onDismiss }: { itemName: string; onUndo: () => void; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-52 left-4 right-4 z-50 flex items-center justify-between gap-3 rounded-2xl bg-gray-900 px-4 py-3.5 shadow-2xl"
      style={{ animation: "slideUpToast 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
    >
      <p className="text-sm font-medium text-white truncate">
        <span className="text-muted-foreground/70"><Trans>Deleted</Trans> </span>
        {itemName}
      </p>
      <button
        type="button"
        onClick={onUndo}
        className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
      >
        <Trans>Undo</Trans>
      </button>
      <style>{`
        @keyframes slideUpToast {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export function ShoppingListView({ list }: ShoppingListViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<ShoppingItem[]>(list.items);
  const [isClearPending, startClearTransition] = useTransition();
  const [isTransferPending, startTransferTransition] = useTransition();
  const [transferDone, setTransferDone] = useState(false);
  const [undoState, setUndoState] = useState<{ item: ShoppingItem } | null>(null);
  const pendingDeleteRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUncheckedLenRef = useRef(list.items.filter((i) => !i.isChecked).length);
  const [showCompletion, setShowCompletion] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const { stores, activeStore, setActiveStore } = useActiveStore();
  const [priceSheetItem, setPriceSheetItem] = useState<ShoppingItem | null>(null);
  const [priceSheetStore, setPriceSheetStore] = useState<UserStoreItem | null | undefined>(undefined);
  const [detailItem, setDetailItem] = useState<ShoppingItem | null>(null);
  const isStoreMode = !!activeStore;

  useEffect(() => {
    setItems(list.items);
  }, [list.items]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`list:${list.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shopping_items", filter: `shopping_list_id=eq.${list.id}` },
        (payload) => {
          const r = payload.new as { id: string; custom_name: string; quantity: number; unit: string; is_checked: boolean; sort_order: number; product_id: string | null; category: string | null };
          setItems((prev) => {
            if (prev.some((i) => i.id === r.id)) return prev;
            return [...prev, { id: r.id, customName: r.custom_name, quantity: r.quantity, unit: r.unit, isChecked: r.is_checked, sortOrder: r.sort_order, productId: r.product_id, category: r.category, allStorePrices: [] }];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shopping_items", filter: `shopping_list_id=eq.${list.id}` },
        (payload) => {
          const r = payload.new as { id: string; is_checked: boolean };
          setItems((prev) => prev.map((i) => i.id === r.id ? { ...i, isChecked: r.is_checked } : i));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "shopping_items", filter: `shopping_list_id=eq.${list.id}` },
        (payload) => {
          const id = (payload.old as { id: string }).id;
          setItems((prev) => prev.filter((i) => i.id !== id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [list.id]);

  const unchecked = items.filter((i) => !i.isChecked).sort((a, b) => a.sortOrder - b.sortOrder);
  const checked = items.filter((i) => i.isChecked).sort((a, b) => a.sortOrder - b.sortOrder);
  const checkedCount = checked.length;

  const groupedUnchecked = unchecked.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const cat = item.category ?? "Autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => groupedUnchecked[c]),
    ...Object.keys(groupedUnchecked).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  useEffect(() => {
    if (sortedCategories.length > 0 && openCategory === null) {
      setOpenCategory(sortedCategories[0]);
    }
  }, [sortedCategories.length]);

  useEffect(() => {
    if (isStoreMode || !openCategory) return;
    const currentItems = groupedUnchecked[openCategory];
    if (!currentItems || currentItems.length > 0) return;
    const nextCat = sortedCategories.find((c) => c !== openCategory && groupedUnchecked[c]?.length > 0);
    if (nextCat) setOpenCategory(nextCat);
  }, [items]);

  useEffect(() => {
    const prev = prevUncheckedLenRef.current;
    const curr = unchecked.length;
    if (prev > 0 && curr === 0 && items.length > 0) {
      setShowCompletion(true);
      const t = setTimeout(() => setShowCompletion(false), 3500);
      return () => clearTimeout(t);
    }
    prevUncheckedLenRef.current = curr;
  }, [unchecked.length, items.length]);

  function handleToggle(id: string, isChecked: boolean) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, isChecked } : item));
    toggleShoppingItem(id, isChecked);
  }

  const commitDelete = useCallback((id: string) => {
    deleteShoppingItem(id);
  }, []);

  function handleDelete(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current);
      if (undoState) commitDelete(undoState.item.id);
    }

    setItems((prev) => prev.filter((i) => i.id !== id));
    setUndoState({ item });

    pendingDeleteRef.current = setTimeout(() => {
      commitDelete(id);
      setUndoState(null);
      pendingDeleteRef.current = null;
    }, 4000);
  }

  function handleUndo() {
    if (!undoState) return;
    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current);
      pendingDeleteRef.current = null;
    }
    setItems((prev) => [...prev, undoState.item].sort((a, b) => a.sortOrder - b.sortOrder));
    setUndoState(null);
  }

  function handleDismissUndo() {
    setUndoState(null);
  }

  function handleClear() {
    setItems((prev) => prev.filter((item) => !item.isChecked));
    startClearTransition(() => clearCheckedItems(list.id));
  }

  function handleTransferToPantry() {
    const payload = checked.map((item) => ({
      name: item.customName,
      quantity: item.quantity,
      unit: item.unit || null,
    }));
    startTransferTransition(async () => {
      await transferCheckedToPantry(payload);
      setTransferDone(true);
      setTimeout(() => setTransferDone(false), 2500);
    });
  }

  function toggleCategory(cat: string) {
    setOpenCategory((prev) => prev === cat ? null : cat);
  }

  if (showCompletion) {
    return (
      <div className="px-4 py-4">
        <CompletionState />
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-30 bg-background/95 px-4 pb-2 pt-2 backdrop-blur-sm">
        <ActiveStoreSelector stores={stores} activeStore={activeStore} onSelect={setActiveStore} />
        {isStoreMode && unchecked.length > 0 && (
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">
              <span className="text-foreground">{unchecked.length}</span> restant{unchecked.length > 1 ? "s" : ""}
              {checked.length > 0 && <span className="text-primary"> · {checked.length} coché{checked.length > 1 ? "s" : ""}</span>}
            </p>
            {checked.length > 0 && (
              <button
                type="button"
                onClick={handleTransferToPantry}
                disabled={isTransferPending || transferDone}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition active:scale-95 disabled:opacity-50"
              >
                {transferDone ? (
                  <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Ajouté !</>
                ) : (
                  <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><line x1="12" y1="22" x2="12" y2="12"/></svg>Au stock ({checked.length})</>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 py-4 pb-44">
        {!isStoreMode && <StoreBanner summaries={list.storeSummaries} activeStoreId={activeStore?.id} />}

        {unchecked.length === 0 && checked.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/8 shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground"><Trans>Start your list</Trans></p>
              <p className="mt-0.5 text-sm text-muted-foreground/70"><Trans>Type below to add your first item</Trans></p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>
        ) : (
          <>
            {sortedCategories.map((category, i) => (
              <CategorySection
                key={category}
                category={category}
                items={groupedUnchecked[category]}
                isOpen={isStoreMode || openCategory === category}
                onToggle={() => !isStoreMode && toggleCategory(category)}
                onToggleItem={handleToggle}
                onDelete={handleDelete}
                onReportPrice={setPriceSheetItem}
                onDetail={setDetailItem}
                activeStoreId={activeStore?.id}
                isStoreMode={isStoreMode}
                animationDelay={i * 55}
              />
            ))}

            {checked.length > 0 && (
              <div className="overflow-hidden rounded-2xl bg-white/50 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
                    <Trans>{checkedCount} checked</Trans>
                  </span>
                  <div className="flex items-center gap-3">
                    {!isStoreMode && (
                      <button
                        type="button"
                        onClick={handleTransferToPantry}
                        disabled={isTransferPending || transferDone}
                        className="flex items-center gap-1 text-xs font-semibold text-primary transition disabled:opacity-50"
                      >
                        {isTransferPending ? (
                          <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        ) : transferDone ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="2" width="18" height="20" rx="2" /><line x1="12" y1="2" x2="12" y2="22" />
                          </svg>
                        )}
                        {transferDone ? "Ajouté !" : "Au stock"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={isClearPending}
                      className="text-xs font-semibold text-destructive transition hover:opacity-70 disabled:opacity-40"
                    >
                      <Trans>Clear</Trans>
                    </button>
                  </div>
                </div>
                {checked.map((item, i) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    hasDivider={i < checked.length - 1}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div
        className="fixed bottom-24 left-0 right-0 z-20 px-4"
        style={{ animation: "slideUpBar 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <AddItemForm listId={list.id} />
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUpBar {
          from { transform: translateY(calc(100% + 2rem)); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {undoState && (
        <UndoToast
          itemName={undoState.item.customName}
          onUndo={handleUndo}
          onDismiss={handleDismissUndo}
        />
      )}

      {detailItem && (
        <ItemDetailSheet
          item={detailItem}
          userStores={stores}
          activeStoreId={activeStore?.id}
          onClose={() => setDetailItem(null)}
          onAddPrice={(store) => {
            setDetailItem(null);
            setPriceSheetStore(store);
            setPriceSheetItem(detailItem);
          }}
        />
      )}

      {priceSheetItem && (
        <IngredientPriceSheet
          shoppingItemId={priceSheetItem.id}
          ingredientName={priceSheetItem.customName}
          defaultUnit={priceSheetItem.unit}
          preselectedStore={priceSheetStore !== undefined ? priceSheetStore : activeStore}
          onClose={() => { setPriceSheetItem(null); setPriceSheetStore(undefined); }}
          onSuccess={() => { setPriceSheetItem(null); setPriceSheetStore(undefined); router.refresh(); }}
        />
      )}
    </>
  );
}
