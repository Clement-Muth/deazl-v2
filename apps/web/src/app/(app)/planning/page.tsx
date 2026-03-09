import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import { getLocale, initLinguiFromCookie } from "@/lib/i18n/server";
import { getMondayOf, parseWeekParam, formatWeekParam, formatWeekRange, addWeeks } from "@/applications/planning/lib/weekUtils";
import { getMealPlan } from "@/applications/planning/application/useCases/getMealPlan";
import { getRecipes } from "@/applications/recipe/application/useCases/getRecipes";
import { createClient } from "@/lib/supabase/server";
import { PlanningGrid } from "@/applications/planning/ui/components/planningGrid/planningGrid";
import { GenerateButton } from "@/applications/shopping/ui/components/generateButton";
import { getActiveShoppingList } from "@/applications/shopping/application/useCases/getActiveShoppingList";
import { getPantryItems } from "@/applications/pantry/application/useCases/getPantryItems";

interface PlanningPageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function PlanningPage({ searchParams }: PlanningPageProps) {
  await initLinguiFromCookie();
  const locale = await getLocale();

  const { week } = await searchParams;
  const monday = week ? parseWeekParam(week) : getMondayOf(new Date());

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userDietaryPreferences: string[] = user?.user_metadata?.dietary_preferences ?? [];

  const [plan, recipes, shoppingList, pantryItems] = await Promise.all([
    getMealPlan(monday),
    getRecipes(),
    getActiveShoppingList(),
    getPantryItems(),
  ]);

  const pantryNames = new Set(pantryItems.map((i) => i.customName.toLowerCase().trim()));
  const pantryRecipeIds = new Set(
    recipes
      .filter((r) => {
        if (r.ingredients.length === 0) return false;
        const matched = r.ingredients.filter((ing) =>
          pantryNames.has(ing.customName.toLowerCase().trim())
        ).length;
        return matched / r.ingredients.length >= 0.5;
      })
      .map((r) => r.id)
  );

  const recipeList = recipes.map((r) => ({
    id: r.id,
    name: r.name,
    dietaryTags: r.dietaryTags,
    inPantry: pantryRecipeIds.has(r.id),
  }));
  const weekLabel = formatWeekRange(monday, locale);
  const prevWeek = formatWeekParam(addWeeks(monday, -1));
  const nextWeek = formatWeekParam(addWeeks(monday, 1));

  if (recipes.length === 0) {
    return (
      <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
        <div className="px-5 pb-1 pt-8">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">{weekLabel}</p>
          <h1 className="text-[2.75rem] font-black leading-[0.9] tracking-tight text-foreground">
            <Trans>Planning</Trans>
          </h1>
        </div>
        <div className="flex flex-col gap-4 px-5 pt-8">
          <p className="text-sm text-muted-foreground">
            <Trans>Start by adding recipes and stores to make the most of your planning.</Trans>
          </p>
          <Link
            href="/recipes"
            className="flex items-center gap-4 rounded-2xl bg-card px-5 py-4 shadow-[0_1px_4px_rgba(28,25,23,0.08)] active:scale-[0.98] transition"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground"><Trans>Import your first recipe</Trans></p>
              <p className="text-xs text-muted-foreground"><Trans>Paste a URL from Marmiton, 750g…</Trans></p>
            </div>
            <svg className="ml-auto text-muted-foreground/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-4 rounded-2xl bg-card px-5 py-4 shadow-[0_1px_4px_rgba(28,25,23,0.08)] active:scale-[0.98] transition"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground"><Trans>Add your stores</Trans></p>
              <p className="text-xs text-muted-foreground"><Trans>Where do you usually shop?</Trans></p>
            </div>
            <svg className="ml-auto text-muted-foreground/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <div className="px-5 pb-1 pt-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">{weekLabel}</p>
            <h1 className="text-[2.75rem] font-black leading-[0.9] tracking-tight text-foreground">
              <Trans>Planning</Trans>
            </h1>
          </div>
          <div className="mt-1 flex">
            <Link
              href={`/planning?week=${prevWeek}`}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-black/5 active:scale-90"
              aria-label="Previous week"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <Link
              href={`/planning?week=${nextWeek}`}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-black/5 active:scale-90"
              aria-label="Next week"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <PlanningGrid
        key={formatWeekParam(monday)}
        initialPlan={{ ...plan, weekStart: monday }}
        recipes={recipeList}
        userDietaryPreferences={userDietaryPreferences}
        locale={locale}
      />

      <div className="px-4 pb-8">
        <div className="flex items-center justify-between rounded-2xl bg-card px-4 py-3.5 shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
          <div>
            <p className="text-sm font-semibold text-foreground">Liste de courses</p>
            <p className="text-xs text-muted-foreground">
              {shoppingList ? "Regénérer depuis ce planning" : "Générer depuis ce planning"}
            </p>
          </div>
          <GenerateButton hasExisting={!!shoppingList} compact />
        </div>
      </div>
    </div>
  );
}
