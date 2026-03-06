import Link from "next/link";
import type { Recipe } from "@/applications/recipe/domain/entities/recipe";

interface RecipeCardProps {
  recipe: Recipe;
}

const DIETARY_LABELS: Record<string, string> = {
  vegetarian: "Végé",
  vegan: "Vegan",
  gluten_free: "GF",
  lactose_free: "SF lait",
  halal: "Halal",
  kosher: "Casher",
  no_pork: "SF porc",
  no_seafood: "SF mer",
};

const PALETTES = [
  { bg: "#FFF7ED", accent: "#EA580C", text: "#9A3412" },
  { bg: "#FEF3C7", accent: "#D97706", text: "#92400E" },
  { bg: "#FDF2F8", accent: "#C026D3", text: "#701A75" },
  { bg: "#EFF6FF", accent: "#2563EB", text: "#1E3A8A" },
  { bg: "#F0FDF4", accent: "#16A34A", text: "#14532D" },
  { bg: "#FFF1F2", accent: "#E11D48", text: "#881337" },
];

function paletteForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

function fmtTime(min: number): string {
  if (min < 60) return `${min}mn`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const pal = paletteForName(recipe.name);
  const initial = recipe.name.trim().charAt(0).toUpperCase();
  const totalPrice = recipe.ingredients.reduce(
    (sum, ing) => (ing.latestPrice ? sum + ing.latestPrice.price : sum),
    0,
  );

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)] transition active:scale-[0.97]"
    >
      <div
        className="relative flex h-32 flex-col justify-end overflow-hidden p-3.5"
        style={recipe.imageUrl ? undefined : { backgroundColor: pal.bg }}
      >
        {recipe.imageUrl ? (
          <>
            <img src={recipe.imageUrl} alt={recipe.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
          </>
        ) : (
          <span
            className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 select-none text-[72px] font-black leading-none"
            style={{ color: pal.accent, opacity: 0.12 }}
          >
            {initial}
          </span>
        )}

        {totalPrice > 0 && (
          <span
            className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={recipe.imageUrl
              ? { background: "rgba(0,0,0,0.35)", color: "#fff" }
              : { background: `${pal.accent}18`, color: pal.accent }}
          >
            ~{totalPrice.toFixed(0)} €
          </span>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-8"
          style={{
            background: recipe.imageUrl
              ? undefined
              : `linear-gradient(to top, ${pal.bg}f0 50%, transparent)`,
          }}
        >
          <span
            className="line-clamp-2 text-sm font-black leading-snug"
            style={{ color: recipe.imageUrl ? "#fff" : pal.text }}
          >
            {recipe.name}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          </svg>
          {recipe.servings}
        </span>
        {totalTime > 0 && (
          <>
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {fmtTime(totalTime)}
            </span>
          </>
        )}
        {recipe.ingredients.length > 0 && (
          <>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-[11px] font-medium text-muted-foreground">
              {recipe.ingredients.length} ingr.
            </span>
          </>
        )}
      </div>
      {recipe.dietaryTags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3.5 pb-2.5 -mt-1">
          {recipe.dietaryTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ background: `${pal.accent}15`, color: pal.text }}
            >
              {DIETARY_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
