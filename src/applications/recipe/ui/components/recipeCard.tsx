import Link from "next/link";
import type { Recipe } from "@/applications/recipe/domain/entities/recipe";

interface RecipeCardProps {
  recipe: Recipe;
}

const GRADIENTS = [
  { from: "#FEF3C7", to: "#FDE68A", text: "#92400E" },
  { from: "#DCFCE7", to: "#BBF7D0", text: "#166534" },
  { from: "#EDE9FE", to: "#DDD6FE", text: "#5B21B6" },
  { from: "#E0F2FE", to: "#BAE6FD", text: "#075985" },
  { from: "#FFE4E6", to: "#FECDD3", text: "#9F1239" },
];

function gradientForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function fmtTime(min: number): string {
  if (min < 60) return `${min}mn`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const grad = gradientForName(recipe.name);
  const initial = recipe.name.trim().charAt(0).toUpperCase();

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition active:scale-[0.97]"
    >
      <div
        className="flex h-28 items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` }}
      >
        <span
          className="select-none text-5xl font-black leading-none tracking-tight"
          style={{ color: grad.text, opacity: 0.9 }}
        >
          {initial}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 px-3.5 py-3">
        <span className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
          {recipe.name}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {recipe.servings}
          </span>
          {totalTime > 0 && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
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
              <span className="text-[11px] text-muted-foreground">{recipe.ingredients.length} ingr.</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
