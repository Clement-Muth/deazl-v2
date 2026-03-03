import Link from "next/link";
import { notFound } from "next/navigation";
import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { getRecipe } from "@/applications/recipe/application/useCases/getRecipe";
import { RecipeDeleteButton } from "@/applications/recipe/ui/components/recipeDeleteButton";
import { IngredientList } from "@/applications/recipe/ui/components/ingredientList";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  await initLinguiFromCookie();
  const { id } = await params;
  const recipe = await getRecipe(id);

  if (!recipe) notFound();

  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/70 px-5 pb-3 pt-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/recipes"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5 text-gray-600 transition hover:bg-black/10 active:scale-[0.94]"
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="flex-1 truncate text-base font-black tracking-tight text-foreground">
            {recipe.name}
          </h1>
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5 text-gray-600 transition hover:bg-black/10 active:scale-[0.94]"
            aria-label="Edit"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-4 px-4 py-5">
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-black/5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <Trans>{recipe.servings} servings</Trans>
          </span>
          {totalTime > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-black/5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {totalTime} min
            </span>
          )}
          {recipe.prepTimeMinutes ? (
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-black/5">
              <Trans>Prep: {recipe.prepTimeMinutes} min</Trans>
            </span>
          ) : null}
          {recipe.cookTimeMinutes ? (
            <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-black/5">
              <Trans>Cook: {recipe.cookTimeMinutes} min</Trans>
            </span>
          ) : null}
        </div>

        {recipe.description && (
          <p className="text-sm leading-relaxed text-gray-600">{recipe.description}</p>
        )}

        {recipe.ingredients.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
            <div className="border-b border-black/5 px-5 py-3.5">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
                <Trans>Ingredients</Trans>
              </h2>
            </div>
            <IngredientList ingredients={recipe.ingredients} recipeId={recipe.id} />
          </div>
        )}

        {recipe.steps.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
            <div className="border-b border-black/5 px-5 py-3.5">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
                <Trans>Steps</Trans>
              </h2>
            </div>
            <ol>
              {recipe.steps.map((step, i) => (
                <li
                  key={step.id}
                  className={`flex gap-4 px-5 py-4 ${
                    i < recipe.steps.length - 1 ? "border-b border-black/4" : ""
                  }`}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {step.stepNumber}
                  </span>
                  <p className="text-sm leading-relaxed text-gray-700">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex justify-center pt-2 pb-4">
          <RecipeDeleteButton id={recipe.id} />
        </div>
      </div>
    </div>
  );
}
