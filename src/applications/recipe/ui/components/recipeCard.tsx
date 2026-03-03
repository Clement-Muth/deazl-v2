import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import type { Recipe } from "@/applications/recipe/domain/entities/recipe";

interface RecipeCardProps {
  recipe: Recipe;
}

const COLORS = [
  "bg-amber-100 text-amber-700",
  "bg-primary-light text-primary",
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const colorClass = colorForName(recipe.name);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex items-center gap-4 rounded-2xl bg-white/80 px-4 py-4 shadow-sm ring-1 ring-black/5 backdrop-blur-sm transition active:scale-[0.99] hover:bg-white/90"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold ${colorClass}`}>
        {recipe.name.trim().charAt(0).toUpperCase()}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-foreground">{recipe.name}</span>
        {recipe.description ? (
          <span className="line-clamp-1 text-xs text-gray-400">{recipe.description}</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              <Trans>{recipe.servings} servings</Trans>
            </span>
            {recipe.ingredients.length > 0 && (
              <>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-400">
                  <Trans>{recipe.ingredients.length} ingredients</Trans>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {totalTime > 0 && (
          <span className="text-xs font-medium text-gray-400">{totalTime} min</span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Link>
  );
}
