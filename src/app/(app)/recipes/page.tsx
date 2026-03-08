import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { getRecipes } from "@/applications/recipe/application/useCases/getRecipes";
import { RecipesView } from "@/applications/recipe/ui/components/recipesView";

export default async function RecipesPage() {
  await initLinguiFromCookie();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userPreferences: string[] = user?.user_metadata?.dietary_preferences ?? [];
  const recipes = await getRecipes();

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <div className="px-5 pb-2 pt-8">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">
          {recipes.length === 0
            ? <Trans>No recipes yet</Trans>
            : <Trans>{recipes.length} recipes</Trans>}
        </p>
        <h1 className="text-[2.75rem] font-black leading-[0.9] tracking-tight text-foreground">
          <Trans>Recipes</Trans>
        </h1>
      </div>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center gap-5 px-8 pt-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50">
              <path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 0 1 7-7z" />
              <path d="M8 18h8" /><path d="M9 21h6" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-foreground"><Trans>No recipes yet</Trans></p>
            <p className="mt-1 text-sm text-muted-foreground"><Trans>Create your first recipe to get started</Trans></p>
          </div>
          <Link
            href="/recipes/new"
            className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <Trans>Add a recipe</Trans>
          </Link>
        </div>
      ) : (
        <RecipesView recipes={recipes} userPreferences={userPreferences} />
      )}
    </div>
  );
}
