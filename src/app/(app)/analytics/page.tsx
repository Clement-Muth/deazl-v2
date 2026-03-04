import { initLinguiFromCookie } from "@/lib/i18n/server";
import { getAnalyticsSummary } from "@/applications/analytics/application/useCases/getAnalyticsSummary";
import { getPriceHistory } from "@/applications/analytics/application/useCases/getPriceHistory";
import { AnalyticsView } from "@/applications/analytics/ui/components/analyticsView";

export default async function AnalyticsPage() {
  await initLinguiFromCookie();
  const [summary, { ingredients, storeComparisons }] = await Promise.all([
    getAnalyticsSummary(),
    getPriceHistory(),
  ]);

  const emptySummary = { totalLists: 0, totalItemsChecked: 0, avgCompletionRate: 0, recentLists: [], categoryBreakdown: [] };

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/70 px-5 pb-3 pt-5 backdrop-blur-xl">
        <h1 className="text-xl font-black tracking-tight text-foreground">Analytics</h1>
        <p className="mt-0.5 text-xs font-medium text-gray-400">Vos habitudes d'achat</p>
      </header>

      <AnalyticsView
        summary={summary ?? emptySummary}
        priceHistory={ingredients}
        storeComparisons={storeComparisons}
      />
    </div>
  );
}
