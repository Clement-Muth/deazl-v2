import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import { getLocale, initLinguiFromCookie } from "@/lib/i18n/server";
import { getMondayOf, parseWeekParam, formatWeekParam, formatWeekRange, addWeeks } from "@/applications/planning/lib/weekUtils";
import { getMealPlan } from "@/applications/planning/application/useCases/getMealPlan";
import { getRecipes } from "@/applications/recipe/application/useCases/getRecipes";
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
  const weekLabel = formatWeekRange(monday, locale);
  const prevWeek = formatWeekParam(addWeeks(monday, -1));
  const nextWeek = formatWeekParam(addWeeks(monday, 1));

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/70 px-5 pb-3 pt-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">
              <Trans>Planning</Trans>
            </h1>
            <p className="mt-0.5 text-xs font-medium text-gray-400">{weekLabel}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/planning?week=${prevWeek}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 text-gray-600 transition hover:bg-black/10 active:scale-[0.94]"
              aria-label="Previous week"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <Link
              href={`/planning?week=${nextWeek}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 text-gray-600 transition hover:bg-black/10 active:scale-[0.94]"
              aria-label="Next week"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <PlanningGrid
        key={formatWeekParam(monday)}
        initialPlan={{ ...plan, weekStart: monday }}
        recipes={recipeList}
        locale={locale}
      />
    </div>
  );
}
