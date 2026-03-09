"use client";

import { useState, useTransition } from "react";
import { updateHouseholdSize } from "@/applications/user/application/useCases/updateHouseholdSize";

interface HouseholdSizeEditorProps {
  initialSize: number;
}

export function HouseholdSizeEditor({ initialSize }: HouseholdSizeEditorProps) {
  const [size, setSize] = useState(initialSize);
  const [, startTransition] = useTransition();

  function change(delta: number) {
    const next = Math.min(10, Math.max(1, size + delta));
    if (next === size) return;
    setSize(next);
    startTransition(() => updateHouseholdSize(next));
  }

  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div>
        <p className="text-sm font-semibold text-foreground">Taille du foyer</p>
        <p className="text-xs text-muted-foreground">
          {size === 1 ? "1 personne" : `${size} personnes`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => change(-1)}
          disabled={size <= 1}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition active:scale-90 disabled:opacity-30"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="w-4 text-center text-base font-black text-foreground tabular-nums">{size}</span>
        <button
          type="button"
          onClick={() => change(1)}
          disabled={size >= 10}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-foreground transition active:scale-90 disabled:opacity-30"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
