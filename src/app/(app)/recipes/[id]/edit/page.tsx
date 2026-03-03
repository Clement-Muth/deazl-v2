import Link from "next/link";
import { notFound } from "next/navigation";
import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { getRecipe } from "@/applications/recipe/application/useCases/getRecipe";
import { updateRecipe } from "@/applications/recipe/application/useCases/updateRecipe";
import { RecipeForm } from "@/applications/recipe/ui/components/recipeForm/recipeForm";

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  await initLinguiFromCookie();
  const { id } = await params;
  const recipe = await getRecipe(id);

  if (!recipe) notFound();

  const action = updateRecipe.bind(null, id);

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/70 px-5 pb-3 pt-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href={`/recipes/${id}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5 text-gray-600 transition hover:bg-black/10 active:scale-[0.94]"
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="flex-1 truncate text-base font-black tracking-tight text-foreground">
            <Trans>Edit recipe</Trans>
          </h1>
        </div>
      </header>

      <div className="px-4 py-5 pb-10">
        <RecipeForm mode="edit" action={action} defaultValues={recipe} />
      </div>
    </div>
  );
}
