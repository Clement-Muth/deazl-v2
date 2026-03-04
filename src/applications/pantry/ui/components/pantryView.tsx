"use client";

import { useState } from "react";
import { PantryItemRow } from "./pantryItemRow";
import { AddPantryItemForm } from "./addPantryItemForm";
import type { PantryItem, StorageLocation } from "@/applications/pantry/domain/entities/pantry";
import { LOCATION_LABELS, LOCATION_ORDER } from "@/applications/pantry/domain/entities/pantry";

const LOCATION_ICONS: Record<StorageLocation, string> = {
  fridge: "❄️",
  freezer: "🧊",
  pantry: "🗄️",
  other: "📦",
};

interface Props {
  items: PantryItem[];
}

export function PantryView({ items }: Props) {
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div className="flex flex-col gap-4 px-4 py-4 pb-8">
      {expiringSoon.length > 0 && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
          <p className="text-xs font-bold text-amber-700">⚠️ {expiringSoon.length} article{expiringSoon.length > 1 ? "s" : ""} expire{expiringSoon.length === 1 ? "" : "nt"} bientôt</p>
          <p className="mt-0.5 text-xs text-amber-600">{expiringSoon.map((i) => i.customName).join(", ")}</p>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-4 pt-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/80 shadow-sm ring-1 ring-black/5 text-3xl">
            🗄️
          </div>
          <div>
            <p className="font-semibold text-gray-700">Stock vide</p>
            <p className="mt-1 text-sm text-gray-400">Ajoutez vos produits pour suivre vos stocks</p>
          </div>
        </div>
      )}

      {LOCATION_ORDER.map((loc) => {
        const locItems = grouped[loc];
        if (!locItems.length) return null;
        return (
          <section key={loc}>
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">
              <span>{LOCATION_ICONS[loc]}</span>
              <span>{LOCATION_LABELS[loc]}</span>
              <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">{locItems.length}</span>
            </h2>
            <div className="flex flex-col gap-2">
              {locItems.map((item) => (
                <PantryItemRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}

      {showForm ? (
        <AddPantryItemForm />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-4 text-sm font-semibold text-gray-400 transition hover:border-primary/40 hover:text-primary active:scale-[0.98]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajouter un produit
        </button>
      )}
    </div>
  );
}
