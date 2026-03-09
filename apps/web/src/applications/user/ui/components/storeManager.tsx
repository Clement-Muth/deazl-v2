"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Trans, useLingui } from "@lingui/react/macro";
import { searchStores } from "@/applications/user/application/useCases/searchStores";
import { searchOSMStores } from "@/applications/user/application/useCases/searchOSMStores";
import { getNearbyStores } from "@/applications/user/application/useCases/getNearbyStores";
import { createStoreFromOSM, createStoreManual } from "@/applications/user/application/useCases/createStore";
import { addUserStore } from "@/applications/user/application/useCases/addUserStore";
import { removeUserStore } from "@/applications/user/application/useCases/removeUserStore";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";
import type { StoreResult } from "@/applications/user/application/useCases/searchStores";
import type { OSMStoreResult } from "@/applications/user/application/useCases/searchOSMStores";

interface SearchResult {
  type: "db" | "osm";
  id?: string;
  osm?: OSMStoreResult;
  name: string;
  city: string;
  detail: string;
}

interface Props {
  initialStores: UserStoreItem[];
}

export function StoreManager({ initialStores }: Props) {
  const { t } = useLingui();
  const [stores, setStores] = useState<UserStoreItem[]>(initialStores);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createBrand, setCreateBrand] = useState("");
  const [createCity, setCreateCity] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    setShowDropdown(true);
    debounceRef.current = setTimeout(async () => {
      const [dbRes, osmRes] = await Promise.all([searchStores(query), searchOSMStores(query)]);
      const storeIds = new Set(stores.map((s) => s.id));
      const dbResults: SearchResult[] = dbRes
        .filter((r) => !storeIds.has(r.id))
        .map((r: StoreResult) => ({
          type: "db" as const, id: r.id, name: r.name, city: r.city,
          detail: [r.address, r.city].filter(Boolean).join(", "),
        }));
      const usedNames = new Set(dbRes.map((r) => `${r.name}|${r.city}`));
      const osmResults: SearchResult[] = osmRes
        .filter((r) => !usedNames.has(`${r.name}|${r.city}`) && !stores.some((s) => s.name === r.name && s.city === r.city))
        .map((r: OSMStoreResult) => ({
          type: "osm" as const, osm: r, name: r.name, city: r.city, detail: r.displayAddress,
        }));
      setResults([...dbResults, ...osmResults]);
      setIsSearching(false);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, stores]);

  function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoError("Géolocalisation non supportée par ce navigateur.");
      return;
    }
    setIsGeolocating(true);
    setGeoError(null);
    setShowDropdown(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nearby = await getNearbyStores(pos.coords.latitude, pos.coords.longitude);
        const filtered = nearby.filter(
          (r) => !stores.some((s) => s.name === r.name && s.city === r.city),
        );
        setResults(filtered.map((r: OSMStoreResult) => ({
          type: "osm" as const, osm: r, name: r.name, city: r.city, detail: r.displayAddress,
        })));
        setShowDropdown(true);
        setIsGeolocating(false);
      },
      () => {
        setGeoError("Impossible d'accéder à votre position. Vérifiez les autorisations.");
        setIsGeolocating(false);
      },
      { timeout: 8000, maximumAge: 60000 },
    );
  }

  async function handleSelect(result: SearchResult) {
    if (result.type === "db" && result.id) {
      const storeId = result.id;
      setStores((prev) => [...prev, { id: storeId, name: result.name, brand: result.name, city: result.city }]);
      setQuery(""); setShowDropdown(false);
      startTransition(() => addUserStore(storeId));
      return;
    }
    if (result.type === "osm" && result.osm) {
      const osm = result.osm;
      startTransition(async () => {
        const store = await createStoreFromOSM(osm);
        if ("error" in store) return;
        setStores((prev) => [...prev, store]);
        await addUserStore(store.id);
        setQuery(""); setShowDropdown(false);
      });
    }
  }

  function handleCreateOpen() {
    setCreateBrand(query.trim()); setCreateCity(""); setCreateAddress("");
    setShowCreate(true); setShowDropdown(false);
  }

  function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!createBrand.trim() || !createCity.trim()) return;
    startTransition(async () => {
      const store = await createStoreManual(createBrand.trim(), createCity.trim(), createAddress.trim() || undefined);
      if ("error" in store) return;
      setStores((prev) => [...prev, store]);
      await addUserStore(store.id);
      setShowCreate(false); setQuery("");
    });
  }

  function handleRemove(storeId: string) {
    setStores((prev) => prev.filter((s) => s.id !== storeId));
    startTransition(() => removeUserStore(storeId));
  }

  return (
    <div className="rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
          <Trans>My stores</Trans>
        </h2>
        {!showSearch && (
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary/80"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <Trans>Add</Trans>
          </button>
        )}
      </div>

      {stores.length === 0 && !showSearch && (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-muted-foreground/70"><Trans>No stores added yet.</Trans></p>
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="mt-3 text-sm font-semibold text-primary"
          >
            <Trans>Add a store</Trans>
          </button>
        </div>
      )}

      {stores.map((store, i) => (
        <div
          key={store.id}
          className={`flex items-center justify-between px-5 py-3.5 ${i < stores.length - 1 || showSearch ? "border-b border-border/60" : ""}`}
        >
          <div>
            <p className="text-sm font-semibold text-foreground">{store.name}</p>
            <p className="text-xs text-muted-foreground/70">{store.city}</p>
          </div>
          <button
            type="button"
            onClick={() => handleRemove(store.id)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground/70 transition hover:bg-red-50 hover:text-red-400"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}

      {showSearch && (
        <div className="p-4">
          <div className="mb-3 flex gap-2">
            <div className={`relative flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 transition ${showDropdown && query.length >= 2 ? "border-primary bg-white ring-2 ring-primary/20" : "border-border bg-muted/60"}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (query.length >= 2) setShowDropdown(true); }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder={t`Ex: Carrefour Nantes…`}
                autoFocus
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-muted-foreground/70"
              />
              {isSearching && (
                <svg className="animate-spin text-muted-foreground/70" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              )}
            </div>

            <button
              type="button"
              onClick={handleGeolocate}
              disabled={isGeolocating}
              title="Magasins autour de moi"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/60 text-muted-foreground transition hover:bg-primary/5 hover:text-primary active:scale-95 disabled:opacity-40"
            >
              {isGeolocating ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  <path d="M12 2a10 10 0 1 0 10 10" />
                </svg>
              )}
            </button>
          </div>

          {geoError && (
            <p className="mb-2 rounded-xl bg-destructive-light px-3 py-2 text-xs text-destructive">{geoError}</p>
          )}

          <div className="relative">
            {showDropdown && !isSearching && results.length >= 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg shadow-black/8">
                {results.length > 0 ? (
                  <>
                    {query.trim().length < 2 && (
                      <p className="border-b border-gray-50 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                        Autour de vous
                      </p>
                    )}
                    {results.map((result, i) => (
                      <button
                        key={`${result.type}-${result.id ?? result.osm?.osmKey ?? i}`}
                        type="button"
                        onMouseDown={() => handleSelect(result)}
                        className="flex w-full items-center justify-between gap-3 border-b border-gray-50 px-3.5 py-2.5 text-left last:border-0 hover:bg-muted/60"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-gray-800">{result.name}</p>
                            {result.type === "db" && (
                              <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary"><Trans>Known</Trans></span>
                            )}
                          </div>
                          {result.detail && <p className="truncate text-xs text-muted-foreground/70">{result.detail}</p>}
                        </div>
                        <svg className="shrink-0 text-muted-foreground/40" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    ))}
                    {query.trim().length >= 2 && (
                      <button
                        type="button"
                        onMouseDown={handleCreateOpen}
                        className="flex w-full items-center gap-1.5 border-t border-gray-100 px-3.5 py-2.5 text-xs font-medium text-muted-foreground/70 hover:bg-muted/60 hover:text-gray-600"
                      >
                        <Trans>Not found? Add manually</Trans>
                      </button>
                    )}
                  </>
                ) : query.trim().length >= 2 ? (
                  <div className="px-3.5 py-3">
                    <p className="mb-2 text-xs text-muted-foreground/70"><Trans>No result for "{query}"</Trans></p>
                    <button
                      type="button"
                      onMouseDown={handleCreateOpen}
                      className="w-full rounded-lg bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/15"
                    >
                      <Trans>Add manually</Trans>
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className="mt-3 flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text" value={createBrand} onChange={(e) => setCreateBrand(e.target.value)}
                  placeholder={t`Brand`} required
                  className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text" value={createCity} onChange={(e) => setCreateCity(e.target.value)}
                  placeholder={t`City`} required
                  className="w-28 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <input
                type="text" value={createAddress} onChange={(e) => setCreateAddress(e.target.value)}
                placeholder={t`Address (optional)`}
                className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex gap-2">
                <button
                  type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-xl border border-border py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60"
                >
                  <Trans>Cancel</Trans>
                </button>
                <button
                  type="submit" disabled={isPending}
                  className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Trans>Add</Trans>
                </button>
              </div>
            </form>
          )}

          {!showCreate && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => { setShowSearch(false); setQuery(""); setShowDropdown(false); setGeoError(null); }}
                className="text-xs font-medium text-muted-foreground/70 hover:text-gray-600"
              >
                <Trans>Done</Trans>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
