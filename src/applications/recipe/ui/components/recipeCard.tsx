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
  const hasImg = !!recipe.imageUrl;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl shadow-[0_2px_10px_rgba(28,25,23,0.1)] transition active:scale-[0.97]"
      style={{ backgroundColor: hasImg ? undefined : pal.bg }}
    >
      <div
        className="relative flex h-44 flex-col justify-end overflow-hidden"
        style={hasImg ? undefined : { backgroundColor: pal.bg }}
      >
        {hasImg ? (
          <>
            <img src={recipe.imageUrl!} alt={recipe.name} className="absolute inset-0 h-full w-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)" }}
            />
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
