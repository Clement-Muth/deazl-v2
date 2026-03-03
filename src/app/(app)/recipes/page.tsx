import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { getRecipes } from "@/applications/recipe/application/useCases/getRecipes";
import { RecipeCard } from "@/applications/recipe/ui/components/recipeCard";

export default async function RecipesPage() {
  await initLinguiFromCookie();
  const recipes = await getRecipes();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground"><Trans>Recipes</Trans></h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {recipes.length === 0
              ? <Trans>No recipes yet</Trans>
              : <Trans>{recipes.length} recipes</Trans>}
          </p>
        </div>
        <Link
          href="/recipes/new"
          className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <Trans>New</Trans>
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 0 1 7-7z" />
              <path d="M8 18h8" /><path d="M9 21h6" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-700"><Trans>No recipes yet</Trans></p>
            <p className="mt-1 text-sm text-gray-400"><Trans>Create your first recipe to get started</Trans></p>
          </div>
          <Link
            href="/recipes/new"
            className="mt-1 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            <Trans>Create a recipe</Trans>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
