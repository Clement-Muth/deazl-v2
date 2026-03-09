"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Recipe } from "@/applications/recipe/domain/entities/recipe";
import { BottomSheet, SheetHandle, useSheetDismiss } from "@/shared/components/ui/bottomSheet";

const PAGE_SIZE = 12;

const DIETARY_LABELS: Record<string, string> = {
  vegetarian: "Végétarien",
  vegan: "Vegan",
  gluten_free: "Sans gluten",
  lactose_free: "Sans lait",
  halal: "Halal",
  kosher: "Casher",
  no_pork: "Sans porc",
  no_seafood: "Sans mer",
};

const PALETTES = [
  { bg: "#FFF7ED", accent: "#EA580C", text: "#9A3412" },
  { bg: "#FEF3C7", accent: "#D97706", text: "#92400E" },
  { bg: "#FDF2F8", accent: "#C026D3", text: "#701A75" },
  { bg: "#EFF6FF", accent: "#2563EB", text: "#1E3A8A" },
  { bg: "#F0FDF4", accent: "#16A34A", text: "#14532D" },
  { bg: "#FFF1F2", accent: "#E11D48", text: "#881337" },
];

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

function fmtTime(min: number) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

type SortOption = "recent" | "fast" | "slow";

interface Props {
  recipes: Recipe[];
  userPreferences: string[];
}

function HeroCard({ recipe }: { recipe: Recipe }) {
  const pal = paletteFor(recipe.name);
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const hasImg = !!recipe.imageUrl;
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group relative mx-4 flex h-60 overflow-hidden rounded-3xl shadow-[0_6px_28px_rgba(28,25,23,0.16)] transition active:scale-[0.98]"
      style={hasImg ? undefined : { backgroundColor: pal.bg }}
    >
      {hasImg ? (
        <img src={recipe.imageUrl!} alt={recipe.name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none text-[140px] font-black leading-none"
          style={{ color: pal.accent, opacity: 0.09 }}
        >
          {recipe.name.charAt(0).toUpperCase()}
        </span>
      )}

      <div
        className="absolute inset-0"
        style={{
          background: hasImg
            ? "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 50%, transparent 100%)"
            : `linear-gradient(to top, ${pal.bg}f8 0%, transparent 65%)`,
        }}
      />

      {totalTime > 0 && (
        <div
          className="absolute right-4 top-4 flex items-center gap-1 rounded-full px-2.5 py-1.5"
          style={hasImg
            ? { background: "rgba(0,0,0,0.38)", backdropFilter: "blur(8px)" }
            : { background: `${pal.accent}20` }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: hasImg ? "#fff" : pal.accent }}>
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-[11px] font-bold" style={{ color: hasImg ? "#fff" : pal.accent }}>
            {fmtTime(totalTime)}
          </span>
        </div>
      )}

      <div className="absolute left-0 right-0 bottom-0 p-5">
        {recipe.dietaryTags.length > 0 && (
          <div className="mb-2 flex gap-1.5">
            {recipe.dietaryTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                style={hasImg
                  ? { background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)" }
                  : { background: `${pal.accent}20`, color: pal.text }}
              >
                {DIETARY_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        )}
        <h3
          className="line-clamp-2 text-xl font-black leading-tight"
          style={{ color: hasImg ? "#fff" : pal.text }}
        >
          {recipe.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex items-center gap-1" style={{ color: hasImg ? "rgba(255,255,255,0.65)" : pal.accent }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-xs font-semibold">{recipe.servings} pers.</span>
          </span>
          {recipe.ingredients.length > 0 && (
            <>
              <span style={{ color: hasImg ? "rgba(255,255,255,0.3)" : `${pal.accent}50` }}>·</span>
              <span className="text-xs font-semibold" style={{ color: hasImg ? "rgba(255,255,255,0.65)" : pal.accent }}>
                {recipe.ingredients.length} ingr.
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function ThumbCard({ recipe }: { recipe: Recipe }) {
  const pal = paletteFor(recipe.name);
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const hasImg = !!recipe.imageUrl;
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex shrink-0 w-40 flex-col overflow-hidden rounded-2xl shadow-[0_2px_8px_rgba(28,25,23,0.1)] transition active:scale-95"
      style={{ backgroundColor: hasImg ? "#fff" : pal.bg }}
    >
      <div className="relative h-28 overflow-hidden" style={hasImg ? undefined : { backgroundColor: pal.bg }}>
        {hasImg ? (
          <>
            <img src={recipe.imageUrl!} alt={recipe.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />
          </>
        ) : (
          <span
            className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 select-none text-[68px] font-black leading-none"
            style={{ color: pal.accent, opacity: 0.11 }}
          >
            {recipe.name.charAt(0).toUpperCase()}
          </span>
        )}
        {totalTime > 0 && (
          <div
            className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
            style={hasImg
              ? { background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }
              : { background: `${pal.accent}1a` }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: hasImg ? "#fff" : pal.accent }}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-[9px] font-bold" style={{ color: hasImg ? "#fff" : pal.accent }}>
              {fmtTime(totalTime)}
            </span>
          </div>
        )}
        {hasImg && (
          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2">
            <span className="line-clamp-2 text-[11px] font-black leading-snug text-white">
              {recipe.name}
            </span>
          </div>
        )}
      </div>
      {!hasImg && (
        <div className="flex flex-col gap-0.5 px-2.5 py-2">
          <span className="line-clamp-2 text-[11px] font-bold leading-snug" style={{ color: pal.text }}>
            {recipe.name}
          </span>
          <span className="text-[10px]" style={{ color: `${pal.accent}80` }}>{recipe.servings} pers.</span>
        </div>
      )}
      {hasImg && (
        <div className="flex items-center gap-1 px-2.5 py-1.5">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          </svg>
          <span className="text-[10px] font-semibold text-muted-foreground/60">{recipe.servings} pers.</span>
        </div>
      )}
    </Link>
  );
}

function GridCard({ recipe }: { recipe: Recipe }) {
  const pal = paletteFor(recipe.name);
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const hasImg = !!recipe.imageUrl;
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl shadow-[0_2px_10px_rgba(28,25,23,0.1)] transition active:scale-[0.97]"
      style={{ backgroundColor: hasImg ? undefined : pal.bg }}
    >
      <div className="relative flex h-44 flex-col justify-end overflow-hidden">
        {hasImg ? (
          <>
            <img src={recipe.imageUrl!} alt={recipe.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)" }} />
          </>
        ) : (
          <span
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 select-none text-[80px] font-black leading-none"
            style={{ color: pal.accent, opacity: 0.11 }}
          >
            {recipe.name.charAt(0).toUpperCase()}
          </span>
        )}

        {totalTime > 0 && (
          <div
            className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full px-2 py-1"
            style={hasImg
              ? { background: "rgba(0,0,0,0.38)", backdropFilter: "blur(6px)" }
              : { background: `${pal.accent}1a` }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: hasImg ? "#fff" : pal.accent }}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-[10px] font-bold" style={{ color: hasImg ? "#fff" : pal.accent }}>
              {fmtTime(totalTime)}
            </span>
          </div>
        )}

        <div className="relative px-3 pb-3 pt-10" style={{ background: hasImg ? undefined : `linear-gradient(to top, ${pal.bg}f5 50%, transparent)` }}>
          <span className="line-clamp-2 text-sm font-black leading-snug" style={{ color: hasImg ? "#fff" : pal.text }}>
            {recipe.name}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-2" style={{ backgroundColor: hasImg ? "#fff" : pal.bg }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        </svg>
        <span className="text-[11px] font-semibold text-muted-foreground">{recipe.servings}</span>
        {recipe.dietaryTags.length > 0 && (
          <>
            <span className="text-muted-foreground/25">·</span>
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ background: `${pal.accent}15`, color: pal.text }}
            >
              {DIETARY_LABELS[recipe.dietaryTags[0]] ?? recipe.dietaryTags[0]}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}

function ListCard({ recipe }: { recipe: Recipe }) {
  const pal = paletteFor(recipe.name);
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex items-center gap-3 rounded-2xl bg-card px-3 py-3 shadow-[0_1px_4px_rgba(28,25,23,0.07)] transition active:scale-[0.98]"
    >
      <div
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl"
        style={recipe.imageUrl ? undefined : { backgroundColor: pal.bg }}
      >
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} className="h-full w-full object-cover" />
        ) : (
          <span
            className="absolute inset-0 flex items-center justify-center text-2xl font-black"
            style={{ color: pal.accent, opacity: 0.5 }}
          >
            {recipe.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-bold text-foreground">{recipe.name}</span>
        <div className="flex items-center gap-2">
          {totalTime > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {fmtTime(totalTime)}
            </span>
          )}
          {recipe.dietaryTags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
              style={{ background: `${pal.accent}15`, color: pal.text }}
            >
              {DIETARY_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>
        {recipe.description && (
          <span className="line-clamp-1 text-[11px] text-muted-foreground/60">{recipe.description}</span>
        )}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground/25">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

function FilterSheetContent({
  activeTags,
  allTags,
  timeFilter,
  sort,
  onToggleTag,
  onSetTime,
  onSetSort,
  onClear,
}: {
  activeTags: string[];
  allTags: string[];
  timeFilter: string;
  sort: SortOption;
  onToggleTag: (t: string) => void;
  onSetTime: (t: string) => void;
  onSetSort: (s: SortOption) => void;
  onClear: () => void;
}) {
  const dismiss = useSheetDismiss();
  const hasFilters = activeTags.length > 0 || timeFilter !== "any" || sort !== "recent";
  return (
    <>
      <SheetHandle>
        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="text-base font-black text-foreground">Filtres</h3>
          {hasFilters && (
            <button type="button" onClick={onClear} className="text-xs font-semibold text-primary">
              Tout effacer
            </button>
          )}
        </div>
      </SheetHandle>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {allTags.length > 0 && (
          <div className="mb-5">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">Régime</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
                    activeTags.includes(tag)
                      ? "bg-primary text-white shadow-sm shadow-primary/30"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {DIETARY_LABELS[tag] ?? tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-5">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">Temps total</p>
          <div className="flex gap-2">
            {[["any", "Tout"], ["quick", "≤ 30 min"], ["medium", "≤ 60 min"]].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => onSetTime(val)}
                className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition active:scale-95 ${
                  timeFilter === val ? "bg-primary text-white shadow-sm shadow-primary/30" : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">Trier par</p>
          <div className="flex gap-2">
            {([["recent", "Plus récent"], ["fast", "Plus rapide"], ["slow", "Plus long"]] as [SortOption, string][]).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => onSetSort(val)}
                className={`flex-1 rounded-2xl py-2.5 text-xs font-bold transition active:scale-95 ${
                  sort === val ? "bg-primary text-white shadow-sm shadow-primary/30" : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-5 w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-sm shadow-primary/30 transition active:scale-[0.98]"
        >
          Appliquer
        </button>
      </div>
    </>
  );
}

export function RecipesView({ recipes, userPreferences }: Props) {
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState("any");
  const [sort, setSort] = useState<SortOption>("recent");
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const r of recipes) r.dietaryTags.forEach((t) => tags.add(t));
    return [...tags];
  }, [recipes]);

  const activeFilterCount = activeTags.length + (timeFilter !== "any" ? 1 : 0) + (sort !== "recent" ? 1 : 0);

  const isSearching = search.trim() !== "";
  const isFiltering = isSearching || activeTags.length > 0 || timeFilter !== "any" || sort !== "recent";

  const filtered = useMemo(() => {
    let result = recipes;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q),
      );
    }
    if (activeTags.length > 0) {
      result = result.filter((r) => activeTags.every((t) => r.dietaryTags.includes(t)));
    }
    if (timeFilter === "quick") {
      result = result.filter((r) => {
        const t = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0);
        return t > 0 && t <= 30;
      });
    } else if (timeFilter === "medium") {
      result = result.filter((r) => {
        const t = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0);
        return t > 0 && t <= 60;
      });
    }
    return [...result].sort((a, b) => {
      if (sort === "recent") return b.createdAt.getTime() - a.createdAt.getTime();
      const ta = (a.prepTimeMinutes ?? 0) + (a.cookTimeMinutes ?? 0);
      const tb = (b.prepTimeMinutes ?? 0) + (b.cookTimeMinutes ?? 0);
      return sort === "fast" ? ta - tb : tb - ta;
    });
  }, [recipes, search, activeTags, timeFilter, sort]);

  const sections = useMemo(() => {
    if (isFiltering) return null;
    const result: { label: string; items: Recipe[] }[] = [];
    if (userPreferences.length > 0) {
      const compatible = recipes.filter((r) => userPreferences.every((p) => r.dietaryTags.includes(p)));
      if (compatible.length > 0) result.push({ label: "Compatibles avec vos goûts", items: compatible });
    }
    const quick = recipes.filter((r) => {
      const t = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0);
      return t > 0 && t <= 30;
    });
    if (quick.length > 0) result.push({ label: "Rapides · moins de 30 min", items: quick });
    return result;
  }, [recipes, userPreferences, isFiltering]);

  const heroRecipe = !isFiltering ? recipes[0] : null;
  const gridRecipes = !isFiltering ? recipes.slice(1) : [];

  function toggleTag(tag: string) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function clearFilters() {
    setSearch("");
    setActiveTags([]);
    setTimeFilter("any");
    setSort("recent");
  }

  return (
    <div className="flex flex-col gap-5 pb-36">
      <div className="px-4 pt-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-2xl bg-card py-3 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-[0_1px_4px_rgba(28,25,23,0.08)] outline-none focus:ring-2 focus:ring-primary/15"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_1px_4px_rgba(28,25,23,0.08)] transition active:scale-95 ${
              activeFilterCount > 0 ? "bg-primary text-white" : "bg-card text-muted-foreground"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-black text-primary shadow-sm">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {activeTags.length > 0 && (
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {activeTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary transition active:scale-95"
              >
                {DIETARY_LABELS[tag] ?? tag}
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {isFiltering ? (
        <div className="flex flex-col gap-3 px-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              {filtered.length} recette{filtered.length !== 1 ? "s" : ""}
            </p>
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-primary">
              Effacer tout
            </button>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-muted">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="font-semibold text-foreground">Aucune recette trouvée</p>
              <button type="button" onClick={clearFilters} className="text-sm font-semibold text-primary">
                Effacer les filtres
              </button>
            </div>
          ) : isSearching ? (
            <div className="flex flex-col gap-2">
              {filtered.map((recipe, i) => (
                <div key={recipe.id} style={{ animation: `fadeSlideUp 0.3s ${i * 30}ms cubic-bezier(0.22,1,0.36,1) both` }}>
                  <ListCard recipe={recipe} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((recipe, i) => (
                <div key={recipe.id} style={{ animation: `fadeSlideUp 0.3s ${i * 30}ms cubic-bezier(0.22,1,0.36,1) both` }}>
                  <GridCard recipe={recipe} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {heroRecipe && <HeroCard recipe={heroRecipe} />}

          {sections && sections.map((section) => (
            <div key={section.label}>
              <p className="mb-2.5 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
                {section.label}
              </p>
              <div className="flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {section.items.map((recipe) => (
                  <ThumbCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          ))}

          {gridRecipes.length > 0 && (
            <div>
              <p className="mb-2.5 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
                Toutes les recettes
              </p>
              <div className="grid grid-cols-2 gap-3 px-4">
                {gridRecipes.slice(0, visibleCount).map((recipe, i) => (
                  <div key={recipe.id} style={{ animation: `fadeSlideUp 0.35s ${i * 35}ms cubic-bezier(0.22,1,0.36,1) both` }}>
                    <GridCard recipe={recipe} />
                  </div>
                ))}
              </div>
              {visibleCount < gridRecipes.length && (
                <div className="px-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="w-full rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold text-muted-foreground shadow-[0_1px_4px_rgba(28,25,23,0.06)] transition active:scale-[0.98]"
                  >
                    Voir {Math.min(PAGE_SIZE, gridRecipes.length - visibleCount)} recettes de plus
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {filterOpen && (
        <BottomSheet onClose={() => setFilterOpen(false)}>
          <FilterSheetContent
            activeTags={activeTags}
            allTags={allTags}
            timeFilter={timeFilter}
            sort={sort}
            onToggleTag={toggleTag}
            onSetTime={setTimeFilter}
            onSetSort={setSort}
            onClear={clearFilters}
          />
        </BottomSheet>
      )}

      <Link
        href="/recipes/new"
        className="fixed bottom-28 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/35 transition active:scale-[0.92]"
        aria-label="Nouvelle recette"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </Link>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
