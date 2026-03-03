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
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/recipes/${id}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-gray-500 transition hover:bg-muted"
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-foreground"><Trans>Edit recipe</Trans></h1>
      </div>

      <RecipeForm mode="edit" action={action} defaultValues={recipe} />
    </div>
  );
}
