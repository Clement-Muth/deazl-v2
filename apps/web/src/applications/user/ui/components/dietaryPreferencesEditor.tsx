"use client";

import { useState, useTransition } from "react";
import { saveDietaryPreferences } from "@/applications/user/application/useCases/saveDietaryPreferences";

const PREFERENCES = [
  { id: "vegetarian", label: "Végétarien" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten_free", label: "Sans gluten" },
  { id: "lactose_free", label: "Sans lactose" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Casher" },
  { id: "no_pork", label: "Sans porc" },
  { id: "no_seafood", label: "Sans fruits de mer" },
];

interface DietaryPreferencesEditorProps {
  initialPreferences: string[];
}

export function DietaryPreferencesEditor({ initialPreferences }: DietaryPreferencesEditorProps) {
  const [selected, setSelected] = useState<string[]>(initialPreferences);
  const [, startTransition] = useTransition();

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((p) => p !== id)
      : [...selected, id];
    setSelected(next);
    startTransition(() => saveDietaryPreferences(next));
  }

  return (
    <div className="px-4 py-3.5">
      <p className="mb-3 text-sm font-semibold text-foreground">Préférences alimentaires</p>
      <div className="flex flex-wrap gap-2">
        {PREFERENCES.map((pref) => {
          const isActive = selected.includes(pref.id);
          return (
            <button
              key={pref.id}
              type="button"
              onClick={() => toggle(pref.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                isActive
                  ? "bg-primary text-white shadow-sm shadow-primary/25"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {pref.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
