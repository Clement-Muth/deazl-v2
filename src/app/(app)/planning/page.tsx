import { getLocale, initLinguiFromCookie } from "@/lib/i18n/server";
import { getMondayOf, parseWeekParam, formatWeekParam } from "@/applications/planning/lib/weekUtils";
import { getMealPlan } from "@/applications/planning/application/useCases/getMealPlan";
import { getRecipes } from "@/applications/recipe/application/useCases/getRecipes";
import { WeekNav } from "@/applications/planning/ui/components/weekNav";
import { PlanningGrid } from "@/applications/planning/ui/components/planningGrid/planningGrid";

interface PlanningPageProps {
  searchParams: Promise<{ week?: string }>;
}

export default async function PlanningPage({ searchParams }: PlanningPageProps) {
  await initLinguiFromCookie();
  const locale = await getLocale();

  const { week } = await searchParams;
  const monday = week ? parseWeekParam(week) : getMondayOf(new Date());

  const [plan, recipes] = await Promise.all([
    getMealPlan(monday),
    getRecipes(),
  ]);

  const recipeList = recipes.map((r) => ({ id: r.id, name: r.name }));

  return (
    <div className="flex flex-col">
      <WeekNav monday={monday} locale={locale} />
      <PlanningGrid
        key={formatWeekParam(monday)}
        initialPlan={{ ...plan, weekStart: monday }}
        recipes={recipeList}
        locale={locale}
      />
    </div>
  );
}
