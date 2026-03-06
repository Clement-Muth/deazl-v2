import { initLinguiFromCookie } from "@/lib/i18n/server";
import { getAnalytics, type NutriscoreDistribution } from "@/applications/analytics/application/useCases/getAnalytics";

const DIETARY_LABELS: Record<string, string> = {
  vegetarian: "Végé",
  vegan: "Vegan",
  gluten_free: "GF",
  lactose_free: "SF lait",
  halal: "Halal",
  kosher: "Casher",
  no_pork: "SF porc",
  no_seafood: "SF mer",
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Petit-déj",
  lunch: "Déjeuner",
  dinner: "Dîner",
};

const PALETTES = [
  { bg: "#FFF7ED", accent: "#EA580C", text: "#9A3412" },
  { bg: "#FEF3C7", accent: "#D97706", text: "#92400E" },
  { bg: "#FDF2F8", accent: "#C026D3", text: "#701A75" },
  { bg: "#EFF6FF", accent: "#2563EB", text: "#1E3A8A" },
  { bg: "#F0FDF4", accent: "#16A34A", text: "#14532D" },
];

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

const NUTRISCORE_CONFIG: { key: keyof NutriscoreDistribution; color: string; label: string }[] = [
  { key: "A", color: "#059669", label: "A" },
  { key: "B", color: "#65a30d", label: "B" },
  { key: "C", color: "#ca8a04", label: "C" },
  { key: "D", color: "#ea580c", label: "D" },
  { key: "E", color: "#dc2626", label: "E" },
];

export default async function AnalyticsPage() {
  await initLinguiFromCookie();
  const analytics = await getAnalytics();
  const { thisWeek, allTime, topRecipes, nutriscoreDistribution, weeklyBudget } = analytics;
  const nutriTotal = Object.values(nutriscoreDistribution).reduce((a, b) => a + b, 0);
  const fillPct = thisWeek.totalSlots > 0 ? Math.round((thisWeek.filledSlots / thisWeek.totalSlots) * 100) : 0;
  const circumference = 2 * Math.PI * 36;
  const strokeDash = (fillPct / 100) * circumference;

  const mealStats = [
    { key: "breakfast", label: MEAL_LABELS.breakfast, count: thisWeek.breakfastCount, max: 7 },
    { key: "lunch", label: MEAL_LABELS.lunch, count: thisWeek.lunchCount, max: 7 },
    { key: "dinner", label: MEAL_LABELS.dinner, count: thisWeek.dinnerCount, max: 7 },
  ];

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <div className="px-5 pb-2 pt-8">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">Cette semaine</p>
        <h1 className="text-[2.75rem] font-black leading-[0.9] tracking-tight text-foreground">Insights</h1>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 pb-36">

        <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
          <div className="flex items-center gap-5 px-5 py-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/60" />
                <circle
                  cx="40" cy="40" r="36"
                  fill="none" stroke="currentColor" strokeWidth="7"
                  strokeLinecap="round"
                  className="text-primary transition-all duration-700"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black leading-none text-foreground">{fillPct}%</span>
                <span className="text-[9px] font-semibold text-muted-foreground/60">planifié</span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              {mealStats.map(({ key, label, count, max }) => (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
                    <span className="text-[11px] font-bold tabular-nums text-foreground">{count}<span className="font-normal text-muted-foreground/50">/{max}</span></span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${Math.round((count / max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-border/50 border-t border-border/50">
            <div className="flex flex-col items-center py-3.5">
              <span className="text-2xl font-black leading-none text-foreground">{allTime.totalMealsPlanned}</span>
              <span className="mt-1 text-[11px] font-medium text-muted-foreground">repas planifiés</span>
            </div>
            <div className="flex flex-col items-center py-3.5">
              <span className="text-2xl font-black leading-none text-foreground">{allTime.totalRecipes}</span>
              <span className="mt-1 text-[11px] font-medium text-muted-foreground">recettes créées</span>
            </div>
          </div>
        </div>

        {weeklyBudget > 0 && (
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">Budget estimé</p>
                <p className="mt-0.5 text-2xl font-black leading-none text-foreground">
                  ~{weeklyBudget.toFixed(0)}<span className="ml-1 text-base font-semibold text-muted-foreground">€</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">pour les repas de la semaine</p>
              </div>
            </div>
          </div>
        )}

        {nutriTotal > 0 && (
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
            <div className="border-b border-border/60 px-5 py-3.5">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
                Nutri-score · repas de la semaine
              </span>
            </div>
            <div className="flex items-end gap-2 px-5 pb-4 pt-4">
              {NUTRISCORE_CONFIG.map(({ key, color, label }) => {
                const count = nutriscoreDistribution[key];
                const pct = nutriTotal > 0 ? Math.round((count / nutriTotal) * 100) : 0;
                return (
                  <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold tabular-nums text-foreground/60">{count > 0 ? count : ""}</span>
                    <div className="w-full overflow-hidden rounded-t-md" style={{ height: 60 }}>
                      <div
                        className="w-full rounded-t-md transition-all duration-700"
                        style={{ height: `${Math.max(pct, count > 0 ? 8 : 0)}%`, backgroundColor: color, minHeight: count > 0 ? 6 : 0 }}
                      />
                    </div>
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white"
                      style={{ backgroundColor: color }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {topRecipes.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
            <div className="border-b border-border/60 px-5 py-3.5">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
                Top recettes
              </span>
            </div>
            {topRecipes.map((recipe, i) => {
              const pal = paletteFor(recipe.recipeName);
              const initial = recipe.recipeName.trim().charAt(0).toUpperCase();
              return (
                <div key={recipe.recipeId}>
                  {i > 0 && <div className="mx-4 h-px bg-border/40" />}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="shrink-0 text-sm font-black text-muted-foreground/30 tabular-nums w-4">{i + 1}</span>
                    <div
                      className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-sm font-black"
                      style={recipe.imageUrl ? undefined : { backgroundColor: pal.bg, color: pal.accent }}
                    >
                      {recipe.imageUrl ? (
                        <img src={recipe.imageUrl} alt={recipe.recipeName} className="h-full w-full object-cover" />
                      ) : initial}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <span className="truncate text-sm font-semibold text-foreground">{recipe.recipeName}</span>
                      {recipe.dietaryTags.length > 0 && (
                        <div className="flex gap-1">
                          {recipe.dietaryTags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                              style={{ background: `${pal.accent}15`, color: pal.text }}
                            >
                              {DIETARY_LABELS[tag] ?? tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end">
                      <span className="text-base font-black leading-none text-primary">{recipe.count}</span>
                      <span className="text-[9px] font-medium text-muted-foreground/50">{recipe.count > 1 ? "fois" : "fois"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {topRecipes.length === 0 && allTime.totalMealsPlanned === 0 && (
          <div className="flex flex-col items-center gap-4 px-8 pt-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-foreground">Pas encore de données</p>
              <p className="mt-1 text-sm text-muted-foreground">Planifie tes repas de la semaine pour voir tes stats</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
