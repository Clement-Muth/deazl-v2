"use client";

import { useState } from "react";
import { PantryItemRow } from "./pantryItemRow";
import { AddPantryItemForm } from "./addPantryItemForm";
import type { PantryItem, StorageLocation } from "@/applications/pantry/domain/entities/pantry";
import { LOCATION_LABELS, LOCATION_ORDER } from "@/applications/pantry/domain/entities/pantry";

const LOCATION_ICONS: Record<StorageLocation, React.ReactNode> = {
  fridge: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="5" y1="10" x2="19" y2="10" /><line x1="15" y1="6" x2="15" y2="8" />
    </svg>
  ),
  freezer: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" /><path d="m17 7-5 5-5-5" /><path d="m17 17-5-5-5 5" />
      <line x1="2" y1="12" x2="22" y2="12" /><path d="m7 7 5 5 5-5" /><path d="m7 17 5-5 5 5" />
    </svg>
  ),
  pantry: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="18" height="20" rx="2" /><line x1="12" y1="2" x2="12" y2="22" />
      <circle cx="7.5" cy="12" r="0.5" fill="currentColor" /><circle cx="16.5" cy="12" r="0.5" fill="currentColor" />
    </svg>
  ),
  other: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="15" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2" /><path d="M8 7V5a2 2 0 0 1 4 0" />
    </svg>
  ),
};

interface Props {
  items: PantryItem[];
}

export function PantryView({ items }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [openLocation, setOpenLocation] = useState<StorageLocation | null>(
    items.length > 0 ? (items[0]?.location ?? "pantry") : null,
  );

  const grouped = LOCATION_ORDER.reduce<Record<StorageLocation, PantryItem[]>>(
    (acc, loc) => ({ ...acc, [loc]: [] }),
    {} as Record<StorageLocation, PantryItem[]>,
  );
  for (const item of items) {
    grouped[item.location].push(item);
  }

  const expiringSoon = items.filter((i) => {
    if (!i.expiryDate) return false;
    const days = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 3;
  });

  const nonEmptyLocations = LOCATION_ORDER.filter((loc) => grouped[loc].length > 0);

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-44">
      {expiringSoon.length > 0 && (
        <div
          className="rounded-2xl bg-accent-light px-4 py-3 ring-1 ring-accent/30"
          style={{ animation: "fadeSlideUp 0.35s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent-dark">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-xs font-bold text-accent-dark">
              {expiringSoon.length} article{expiringSoon.length > 1 ? "s" : ""} expire{expiringSoon.length === 1 ? "" : "nt"} bientôt
            </p>
          </div>
          <p className="mt-1 pl-5 text-xs text-accent-dark/70">{expiringSoon.map((i) => i.customName).join(", ")}</p>
        </div>
      )}

      {items.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 pt-16 text-center"
          style={{ animation: "fadeSlideUp 0.4s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="2" width="18" height="20" rx="2" /><line x1="12" y1="2" x2="12" y2="22" />
              <circle cx="7.5" cy="12" r="0.5" fill="#D1D5DB" /><circle cx="16.5" cy="12" r="0.5" fill="#D1D5DB" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">Stock vide</p>
            <p className="mt-1 text-sm text-muted-foreground">Ajoutez vos produits pour suivre vos stocks</p>
          </div>
        </div>
      ) : (
        nonEmptyLocations.map((loc, sectionIdx) => {
          const locItems = grouped[loc];
          const isOpen = openLocation === loc;
          return (
            <div
              key={loc}
              className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]"
              style={{ animation: `fadeSlideUp 0.35s ${sectionIdx * 60}ms cubic-bezier(0.22,1,0.36,1) both` }}
            >
              <button
                type="button"
                onClick={() => setOpenLocation(isOpen ? null : loc)}
                className="flex w-full items-center gap-2.5 px-4 py-3"
              >
                <span className="text-muted-foreground">{LOCATION_ICONS[loc]}</span>
                <span className="flex-1 text-left text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {LOCATION_LABELS[loc]}
                </span>
                <span className="text-xs font-medium text-muted-foreground/60">{locItems.length}</span>
                <svg
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)", flexShrink: 0 }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div
                style={{
                  display: "grid",
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.28s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-2 px-3 pb-3">
                    {locItems.map((item) => (
                      <PantryItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {showForm && (
        <div
          className="fixed bottom-24 left-0 right-0 z-20 px-4"
          style={{ animation: "slideUpBar 0.32s cubic-bezier(0.32,0.72,0,1) both" }}
        >
          <AddPantryItemForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 left-4 right-4 z-20 flex items-center justify-center gap-2 rounded-2xl bg-white/90 py-4 text-sm font-semibold text-muted-foreground shadow-lg shadow-black/5 backdrop-blur-xl transition hover:text-primary active:scale-[0.98]"
          style={{ animation: "slideUpBar 0.32s cubic-bezier(0.32,0.72,0,1) both" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajouter un produit
        </button>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUpBar {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
