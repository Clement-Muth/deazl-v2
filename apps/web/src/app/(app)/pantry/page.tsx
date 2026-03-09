import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { getPantryItems } from "@/applications/pantry/application/useCases/getPantryItems";
import { getRecipes } from "@/applications/recipe/application/useCases/getRecipes";
import { PantryView } from "@/applications/pantry/ui/components/pantryView";

const PALETTES = [
  { bg: "#FFF7ED", accent: "#EA580C", text: "#9A3412" },
  { bg: "#FEF3C7", accent: "#D97706", text: "#92400E" },
  { bg: "#FDF2F8", accent: "#C026D3", text: "#701A75" },
  { bg: "#EFF6FF", accent: "#2563EB", text: "#1E3A8A" },
  { bg: "#F0FDF4", accent: "#16A34A", text: "#14532D" },
];

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export default async function PantryPage() {
  await initLinguiFromCookie();
  const [items, recipes] = await Promise.all([getPantryItems(), getRecipes()]);

  const expiredCount = items.filter((i) => {
    if (!i.expiryDate) return false;
    return new Date(i.expiryDate).getTime() < Date.now();
  }).length;

  const expiringSoon = items.filter((i) => {
    if (!i.expiryDate) return false;
    const days = Math.ceil((new Date(i.expiryDate).getTime() - Date.now()) / 86400000);
    return days >= 0 && days <= 3;
  });

  const expiryNames = new Set(expiringSoon.map((i) => i.customName.toLowerCase().trim()));
  const urgentRecipes = recipes
    .filter((r) => r.ingredients.some((ing) => expiryNames.has(ing.customName.toLowerCase().trim())))
    .slice(0, 5);

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <div className="px-5 pb-2 pt-8">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">
          {items.length === 0
            ? <Trans>No items</Trans>
            : expiredCount > 0
              ? <Trans>{items.length} items · {expiredCount} expired</Trans>
              : <Trans>{items.length} items</Trans>}
        </p>
        <h1 className="text-[2.75rem] font-black leading-[0.9] tracking-tight text-foreground">
          <Trans>Pantry</Trans>
        </h1>
      </div>

      {urgentRecipes.length > 0 && (
        <div className="px-4 pb-2">
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
            <div className="flex items-center gap-2.5 border-b border-border/50 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent-dark">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-xs font-bold text-accent-dark">À cuisiner rapidement</p>
              <p className="ml-auto text-[11px] text-muted-foreground/60">
                {expiringSoon.map((i) => i.customName).join(", ")}
              </p>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {urgentRecipes.map((recipe) => {
                const pal = paletteFor(recipe.name);
                const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
                return (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.id}`}
                    className="flex shrink-0 w-44 flex-col overflow-hidden rounded-xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)] transition active:scale-95"
                  >
                    <div
                      className="relative flex h-24 items-end overflow-hidden p-2.5"
                      style={recipe.imageUrl ? undefined : { backgroundColor: pal.bg }}
                    >
                      {recipe.imageUrl ? (
                        <>
                          <img src={recipe.imageUrl} alt={recipe.name} className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                        </>
                      ) : (
                        <span
                          className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 select-none text-[56px] font-black leading-none"
                          style={{ color: pal.accent, opacity: 0.12 }}
                        >
                          {recipe.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span
                        className="relative line-clamp-2 text-[11px] font-black leading-snug"
                        style={{ color: recipe.imageUrl ? "#fff" : pal.text }}
                      >
                        {recipe.name}
                      </span>
                    </div>
                    {totalTime > 0 && (
                      <div className="flex items-center gap-1 px-2.5 py-1.5">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {totalTime < 60 ? `${totalTime}min` : `${Math.floor(totalTime / 60)}h${totalTime % 60 > 0 ? totalTime % 60 : ""}`}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <PantryView items={items} />
    </div>
  );
}
