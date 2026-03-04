import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { getRecipes } from "@/applications/recipe/application/useCases/getRecipes";
import { RecipeCard } from "@/applications/recipe/ui/components/recipeCard";

export default async function RecipesPage() {
  await initLinguiFromCookie();
  const recipes = await getRecipes();

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/70 px-5 pb-3 pt-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">
              <Trans>Recipes</Trans>
            </h1>
            <p className="mt-0.5 text-xs font-medium text-gray-400">
              {recipes.length === 0
                ? <Trans>No recipes yet</Trans>
                : <Trans>{recipes.length} recipes</Trans>}
            </p>
          </div>
          <Link
            href="/recipes/new"
            className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-primary/30 transition active:scale-[0.95]"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <Trans>New</Trans>
          </Link>
        </div>
      </header>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-8 pt-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/80 shadow-sm ring-1 ring-black/5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 0 1 7-7z" />
              <path d="M8 18h8" /><path d="M9 21h6" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground"><Trans>No recipes yet</Trans></p>
            <p className="mt-1 text-sm text-gray-400"><Trans>Create your first recipe to get started</Trans></p>
          </div>
          <Link
            href="/recipes/new"
            className="mt-1 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition active:scale-[0.98]"
          >
            <Trans>Create a recipe</Trans>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 py-4">
          {recipes.map((recipe, i) => (
            <div key={recipe.id} style={{ animation: `fadeSlideUp 0.35s ${i * 40}ms cubic-bezier(0.22,1,0.36,1) both` }}>
              <RecipeCard recipe={recipe} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
