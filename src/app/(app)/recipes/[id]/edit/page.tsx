import { notFound } from "next/navigation";
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
    <div className="min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <RecipeForm mode="edit" action={action} defaultValues={recipe} backHref={`/recipes/${id}`} />
    </div>
  );
}
