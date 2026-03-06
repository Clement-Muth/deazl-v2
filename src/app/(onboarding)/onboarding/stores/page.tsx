"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { completeOnboarding } from "@/applications/user/application/useCases/completeOnboarding";
import { searchStores } from "@/applications/user/application/useCases/searchStores";
import { searchOSMStores } from "@/applications/user/application/useCases/searchOSMStores";
import { createStoreFromOSM, createStoreManual } from "@/applications/user/application/useCases/createStore";
import type { StoreResult } from "@/applications/user/application/useCases/searchStores";
import type { OSMStoreResult } from "@/applications/user/application/useCases/searchOSMStores";

interface SelectedStore {
  id: string;
  name: string;
  city: string;
}

interface SearchResult {
  type: "db" | "osm";
  id?: string;
  osm?: OSMStoreResult;
  name: string;
  city: string;
  detail: string;
}

export default function StoresPage() {
  const { t } = useLingui();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SelectedStore[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createBrand, setCreateBrand] = useState("");
  const [createCity, setCreateCity] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setShowDropdown(true);
    debounceRef.current = setTimeout(async () => {
      const [dbRes, osmRes] = await Promise.all([
        searchStores(query),
        searchOSMStores(query),
      ]);

      const dbResults: SearchResult[] = dbRes
        .filter((r) => !selected.some((s) => s.id === r.id))
        .map((r: StoreResult) => ({
          type: "db" as const,
          id: r.id,
          name: r.name,
          city: r.city,
          detail: [r.address, r.city].filter(Boolean).join(", "),
        }));

      const usedNames = new Set(dbRes.map((r) => `${r.name}|${r.city}`));
      const osmResults: SearchResult[] = osmRes
        .filter((r) => !usedNames.has(`${r.name}|${r.city}`) && !selected.some((s) => s.name === r.name && s.city === r.city))
        .map((r: OSMStoreResult) => ({
          type: "osm" as const,
          osm: r,
          name: r.name,
          city: r.city,
          detail: r.displayAddress,
        }));

      setResults([...dbResults, ...osmResults]);
      setIsSearching(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selected]);

  async function handleSelect(result: SearchResult) {
    if (result.type === "db" && result.id) {
      setSelected((prev) => [...prev, { id: result.id!, name: result.name, city: result.city }]);
      setQuery("");
      setShowDropdown(false);
      return;
    }

    if (result.type === "osm" && result.osm) {
      startTransition(async () => {
        const store = await createStoreFromOSM(result.osm!);
        if ("error" in store) return;
        setSelected((prev) => [...prev, { id: store.id, name: store.name, city: store.city }]);
        setQuery("");
        setShowDropdown(false);
      });
    }
  }

  function handleCreateOpen() {
    setCreateBrand(query.trim());
    setCreateCity("");
    setCreateAddress("");
    setShowCreate(true);
    setShowDropdown(false);
  }

  function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!createBrand.trim() || !createCity.trim()) return;
    startTransition(async () => {
      const store = await createStoreManual(
        createBrand.trim(),
        createCity.trim(),
        createAddress.trim() || undefined,
      );
      if ("error" in store) return;
      setSelected((prev) => [...prev, { id: store.id, name: store.name, city: store.city }]);
      setShowCreate(false);
      setQuery("");
    });
  }

  function handleContinue() {
    startTransition(() => completeOnboarding(selected.map((s) => s.id)));
  }

  const hasResults = results.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="px-6 pt-2">
        <div className="mb-8">
          <h1 className="text-[28px] font-black leading-tight tracking-tight text-gray-900 animate-fade-up [animation-delay:80ms]">
            <Trans>Your usual<br />stores</Trans>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground/70 animate-fade-up [animation-delay:160ms]">
            <Trans>To compare prices as accurately as possible.</Trans>
          </p>
        </div>

        {selected.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {selected.map((store) => (
              <div
                key={store.id}
                className="flex items-center justify-between rounded-2xl border-2 border-primary/20 bg-primary/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{store.name}</p>
                  <p className="text-xs text-muted-foreground/70">{store.city}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected((prev) => prev.filter((s) => s.id !== store.id))}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground/70 transition hover:bg-gray-200 hover:text-gray-600"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <div
            className={`flex items-center gap-2 rounded-2xl border px-4 py-3 transition ${
              showDropdown && query.length >= 2
                ? "border-primary bg-white ring-2 ring-primary/20"
                : "border-border bg-muted/60"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (query.length >= 2) setShowDropdown(true); }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder={t`Ex: Carrefour Nantes, Leclerc Bordeaux…`}
              className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-muted-foreground/70"
            />
            {isSearching ? (
              <svg className="animate-spin text-muted-foreground/70" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : query.length > 0 ? (
              <button
                type="button"
                onClick={() => { setQuery(""); setShowDropdown(false); }}
                className="text-muted-foreground/40 hover:text-muted-foreground"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : null}
          </div>

          {showDropdown && query.length >= 2 && !isSearching && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-black/8">
              {hasResults ? (
                <>
                  {results.map((result, i) => (
                    <button
                      key={`${result.type}-${result.id ?? result.osm?.osmKey ?? i}`}
                      type="button"
                      onMouseDown={() => handleSelect(result)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/60 border-b border-gray-50 last:border-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-800">{result.name}</p>
                          {result.type === "db" && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                              <Trans>Known</Trans>
                            </span>
                          )}
                        </div>
                        {result.detail && (
                          <p className="truncate text-xs text-muted-foreground/70">{result.detail}</p>
                        )}
                      </div>
                      {isPending ? (
                        <svg className="animate-spin shrink-0 text-primary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      ) : (
                        <svg className="shrink-0 text-muted-foreground/40" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onMouseDown={handleCreateOpen}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-muted-foreground/70 transition hover:bg-muted/60 hover:text-gray-600 border-t border-gray-100"
                  >
                    <Trans>Not in the list? Add manually</Trans>
                  </button>
                </>
              ) : (
                <div className="px-4 py-4">
                  <p className="text-sm text-muted-foreground/70 mb-3">
                    <Trans>No store found for "{query}"</Trans>
                  </p>
                  <button
                    type="button"
                    onMouseDown={handleCreateOpen}
                    className="w-full rounded-xl bg-primary/10 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/15"
                  >
                    <Trans>Add manually</Trans>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {showCreate && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-muted/60">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70"><Trans>New store</Trans></p>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-muted-foreground/40 hover:text-muted-foreground"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-2.5 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={createBrand}
                  onChange={(e) => setCreateBrand(e.target.value)}
                  placeholder={t`Brand (Carrefour, Leclerc…)`}
                  required
                  className="flex-1 rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  value={createCity}
                  onChange={(e) => setCreateCity(e.target.value)}
                  placeholder={t`City`}
                  required
                  className="w-32 rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <input
                type="text"
                value={createAddress}
                onChange={(e) => setCreateAddress(e.target.value)}
                placeholder={t`Address (optional)`}
                className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
              >
                {isPending ? <Trans>Adding…</Trans> : <Trans>Add this store</Trans>}
              </button>
            </form>
          </div>
        )}

        <div className="h-52" />
      </div>

      <div className="fixed bottom-0 left-0 right-0">
        <div className="h-8 bg-linear-to-t from-white to-transparent" />
        <div className="bg-white px-6 pb-10 pt-1">
          {selected.length > 0 && (
            <p className="mb-2.5 text-center text-xs font-medium text-muted-foreground/70">
              {selected.length === 1
                ? <Trans>1 store selected</Trans>
                : <Trans>{selected.length} stores selected</Trans>}
            </p>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={handleContinue}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            <span>{selected.length === 0 ? t`Skip this step` : t`Start`}</span>
            {isPending ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
