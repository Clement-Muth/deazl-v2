"use client";

import { useRef, useState, useTransition } from "react";
import { updateDisplayName } from "@/applications/user/application/useCases/updateDisplayName";

export function DisplayNameEditor({ initialName }: { initialName: string }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    const name = inputRef.current?.value ?? "";
    if (!name.trim()) return;
    startTransition(async () => {
      await updateDisplayName(name);
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between px-4 py-3.5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">Nom affiché</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{initialName || "Non renseigné"}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-semibold text-primary"
        >
          Modifier
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <input
        ref={inputRef}
        defaultValue={initialName}
        autoFocus
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
        className="flex-1 rounded-xl bg-muted px-3 py-2 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
        placeholder="Votre nom"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="shrink-0 text-xs font-bold text-primary disabled:opacity-50"
      >
        {isPending ? "..." : "OK"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="shrink-0 text-xs font-medium text-muted-foreground"
      >
        Annuler
      </button>
    </div>
  );
}
