import Link from "next/link";
import { notFound } from "next/navigation";
import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { getRecipe } from "@/applications/recipe/application/useCases/getRecipe";
import { RecipeDeleteButton } from "@/applications/recipe/ui/components/recipeDeleteButton";

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
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <Link
          href="/recipes"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-gray-500 transition hover:bg-muted"
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="flex-1 text-xl font-bold text-foreground leading-snug">{recipe.name}</h1>
        <Link
          href={`/recipes/${recipe.id}/edit`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-gray-500 transition hover:bg-muted"
          aria-label="Edit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-sm text-gray-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <Trans>{recipe.servings} servings</Trans>
        </div>
        {totalTime > 0 && (
          <div className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-sm text-gray-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {totalTime} min
          </div>
        )}
        {recipe.prepTimeMinutes && (
          <div className="rounded-xl bg-muted px-3 py-1.5 text-sm text-gray-600">
            <Trans>Prep: {recipe.prepTimeMinutes} min</Trans>
          </div>
        )}
        {recipe.cookTimeMinutes && (
          <div className="rounded-xl bg-muted px-3 py-1.5 text-sm text-gray-600">
            <Trans>Cook: {recipe.cookTimeMinutes} min</Trans>
          </div>
        )}
      </div>

      {recipe.description && (
        <p className="text-sm text-gray-600 leading-relaxed">{recipe.description}</p>
      )}

      {recipe.ingredients.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">
            <Trans>Ingredients</Trans>
          </h2>
          <ul className="flex flex-col gap-2">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-2.5">
                <span className="text-sm text-foreground">{ing.customName}</span>
                <span className="text-sm font-medium text-gray-500 shrink-0">
                  {ing.quantity} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recipe.steps.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">
            <Trans>Steps</Trans>
          </h2>
          <ol className="flex flex-col gap-3">
            {recipe.steps.map((step) => (
              <li key={step.id} className="flex gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary mt-0.5">
                  {step.stepNumber}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <RecipeDeleteButton id={recipe.id} />
      </div>
    </div>
  );
}
