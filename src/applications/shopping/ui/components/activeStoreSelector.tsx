"use client";

import { useState } from "react";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";

interface ActiveStoreSelectorProps {
  stores: UserStoreItem[];
  activeStore: UserStoreItem | null;
  onSelect: (store: UserStoreItem | null) => void;
}

export function ActiveStoreSelector({ stores, activeStore, onSelect }: ActiveStoreSelectorProps) {
  const [open, setOpen] = useState(false);

  if (stores.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-[0_1px_4px_rgba(28,25,23,0.08)] transition active:scale-[0.98]"
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${activeStore ? "bg-primary/10" : "bg-muted"}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={activeStore ? "var(--color-primary)" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          {activeStore ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/60">Je suis chez</p>
              <p className="text-sm font-bold text-foreground">{activeStore.name}</p>
            </>
          ) : (
            <p className="text-sm font-medium text-muted-foreground">Choisir mon magasin du jour</p>
          )}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full rounded-t-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Dans quel magasin ?</h2>
              <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {stores.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => { onSelect(store); setOpen(false); }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition active:scale-[0.98] ${
                    activeStore?.id === store.id
                      ? "bg-primary text-white"
                      : "bg-muted text-foreground hover:bg-gray-100"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  <span className="flex-1 text-sm font-medium">{store.name}</span>
                  {activeStore?.id === store.id && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              ))}
              {activeStore && (
                <button
                  type="button"
                  onClick={() => { onSelect(null); setOpen(false); }}
                  className="mt-1 text-center text-sm text-muted-foreground/70"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
