import { initLinguiFromCookie } from "@/lib/i18n/server";
import { NewRecipeShell } from "@/applications/recipe/ui/components/newRecipeShell";
import { createRecipe } from "@/applications/recipe/application/useCases/createRecipe";

export default async function NewRecipePage() {
  await initLinguiFromCookie();

  return (
    <div className="min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <NewRecipeShell createAction={createRecipe} />
    </div>
  );
}
