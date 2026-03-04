"use client";

import { useActionState, useRef, useState } from "react";
import { addPantryItem } from "@/applications/pantry/application/useCases/addPantryItem";
import type { StorageLocation } from "@/applications/pantry/domain/entities/pantry";

const LOCATIONS: { value: StorageLocation; label: string; icon: string }[] = [
  { value: "fridge", label: "Frigo", icon: "❄️" },
  { value: "freezer", label: "Congél", icon: "🧊" },
  { value: "pantry", label: "Placard", icon: "🗄️" },
  { value: "other", label: "Autre", icon: "📦" },
];

export function AddPantryItemForm() {
  const [state, action, isPending] = useActionState(addPantryItem, undefined);
  const [location, setLocation] = useState<StorageLocation>("pantry");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
      <form
        ref={formRef}
        action={async (fd) => {
          fd.set("location", location);
          await action(fd);
          formRef.current?.reset();
        }}
        className="flex flex-col gap-3 p-4"
      >
        <div className="flex gap-2">
          <input
            name="name"
            type="text"
            placeholder="Nom du produit"
            required
            className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex gap-2">
          <input
            name="quantity"
            type="text"
            inputMode="decimal"
            placeholder="Qté"
            className="w-20 shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
          <input
            name="unit"
            type="text"
            placeholder="Unité (kg, L…)"
            className="w-28 shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
          <input
            name="expiry_date"
            type="date"
            className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.value}
                type="button"
                onClick={() => setLocation(loc.value)}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                  location === loc.value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <span>{loc.icon}</span>
                <span className="hidden sm:inline">{loc.label}</span>
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition active:scale-[0.95] disabled:opacity-40"
          >
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </button>
        </div>

        {state?.error && (
          <p className="text-xs text-red-500">{state.error}</p>
        )}
      </form>
    </div>
  );
}
