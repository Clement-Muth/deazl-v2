import { initLinguiFromCookie } from "@/lib/i18n/server";
import { RecipeForm } from "@/applications/recipe/ui/components/recipeForm/recipeForm";
import { createRecipe } from "@/applications/recipe/application/useCases/createRecipe";

export default async function NewRecipePage() {
  await initLinguiFromCookie();

  return (
    <div className="min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <RecipeForm mode="create" action={createRecipe} backHref="/recipes" />
    </div>
  );
}
