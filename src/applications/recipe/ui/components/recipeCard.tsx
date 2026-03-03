import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import type { Recipe } from "@/applications/recipe/domain/entities/recipe";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-white p-4 transition active:scale-[0.98] hover:border-gray-300"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground leading-snug">{recipe.name}</h3>
        {totalTime > 0 && (
          <span className="shrink-0 text-xs text-gray-400 mt-0.5">{totalTime} min</span>
        )}
      </div>

      {recipe.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{recipe.description}</p>
      )}

      <div className="flex items-center gap-3 mt-1">
        <span className="text-xs text-gray-400">
          <Trans>{recipe.servings} servings</Trans>
        </span>
        {recipe.ingredients.length > 0 && (
          <span className="text-xs text-gray-400">
            <Trans>{recipe.ingredients.length} ingredients</Trans>
          </span>
        )}
      </div>
    </Link>
  );
}
