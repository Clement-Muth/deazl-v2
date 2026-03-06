"use client";

import { useActionState, useRef, useState } from "react";
import { addPantryItem } from "@/applications/pantry/application/useCases/addPantryItem";
import type { StorageLocation } from "@/applications/pantry/domain/entities/pantry";

const LOCATIONS: { value: StorageLocation; label: string; icon: React.ReactNode }[] = [
  {
    value: "fridge",
    label: "Frigo",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="5" y1="10" x2="19" y2="10" /><line x1="15" y1="6" x2="15" y2="8" />
      </svg>
    ),
  },
  {
    value: "freezer",
    label: "Congél",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="22" /><path d="m17 7-5 5-5-5" /><path d="m17 17-5-5-5 5" />
        <line x1="2" y1="12" x2="22" y2="12" /><path d="m7 7 5 5 5-5" /><path d="m7 17 5-5 5 5" />
      </svg>
    ),
  },
  {
    value: "pantry",
    label: "Placard",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="2" width="18" height="20" rx="2" /><line x1="12" y1="2" x2="12" y2="22" />
        <circle cx="7.5" cy="12" r="0.5" fill="currentColor" /><circle cx="16.5" cy="12" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: "other",
    label: "Autre",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="15" rx="2" /><path d="M16 7V5a2 2 0 0 0-4 0v2" /><path d="M8 7V5a2 2 0 0 1 4 0" />
      </svg>
    ),
  },
];

interface Props {
  onClose: () => void;
}

export function AddPantryItemForm({ onClose }: Props) {
  const [state, action, isPending] = useActionState(addPantryItem, undefined);
  const [location, setLocation] = useState<StorageLocation>("pantry");
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
      <form
        ref={formRef}
        action={async (fd) => {
          fd.set("location", location);
          await action(fd);
          if (!state?.error) {
            formRef.current?.reset();
            setLocation("pantry");
            onClose();
          }
        }}
        className="flex flex-col gap-3 p-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">Ajouter au stock</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted active:scale-90"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <input
          name="name"
          type="text"
          placeholder="Nom du produit"
          required
          autoFocus
          className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
        />

        <div className="flex gap-2">
          <input
            name="quantity"
            type="text"
            inputMode="decimal"
            placeholder="Qté"
            className="w-20 shrink-0 rounded-xl border border-border bg-muted px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
          <input
            name="unit"
            type="text"
            placeholder="kg, L, pcs…"
            className="flex-1 rounded-xl border border-border bg-muted px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
          <input
            name="expiry_date"
            type="date"
            className="flex-1 rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5">
            {LOCATIONS.map((loc) => (
              <button
                key={loc.value}
                type="button"
                onClick={() => setLocation(loc.value)}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                  location === loc.value
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                {loc.icon}
                <span className="inline">{loc.label}</span>
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition active:scale-[0.95] disabled:opacity-40"
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
          <p className="text-xs text-destructive">{state.error}</p>
        )}
      </form>
    </div>
  );
}
