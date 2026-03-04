"use client";

import { CategoryDonut } from "./categoryDonut";
import { PriceLineChart } from "./priceLineChart";
import { CompletionBars } from "./completionBars";
import type { AnalyticsSummary, IngredientPriceHistory, StoreComparison } from "@/applications/analytics/domain/entities/analytics";

interface Props {
  summary: AnalyticsSummary;
  priceHistory: IngredientPriceHistory[];
  storeComparisons: StoreComparison[];
}

export function AnalyticsView({ summary, priceHistory, storeComparisons }: Props) {
  const hasPriceData = priceHistory.length > 0;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-white/80 py-4 shadow-sm ring-1 ring-black/5">
          <span className="text-2xl font-bold text-gray-800">{summary.totalLists}</span>
          <span className="text-center text-[10px] font-medium text-gray-400">listes créées</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-white/80 py-4 shadow-sm ring-1 ring-black/5">
          <span className="text-2xl font-bold text-gray-800">{summary.totalItemsChecked}</span>
          <span className="text-center text-[10px] font-medium text-gray-400">articles cochés</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-white/80 py-4 shadow-sm ring-1 ring-black/5">
          <span className="text-2xl font-bold text-primary">{summary.avgCompletionRate}%</span>
          <span className="text-center text-[10px] font-medium text-gray-400">complétion</span>
        </div>
      </div>

      {summary.categoryBreakdown.length > 0 && (
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 text-sm font-bold text-gray-800">Répartition par catégorie</h2>
          <CategoryDonut data={summary.categoryBreakdown} />
          <div className="mt-3 flex flex-col gap-1.5">
            {summary.categoryBreakdown.slice(0, 6).map((cat, i) => {
              const colors = ["#22c55e","#f97316","#3b82f6","#a855f7","#eab308","#14b8a6"];
              return (
                <div key={cat.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                    <span className="text-xs text-gray-600">{cat.category}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {summary.recentLists.length > 0 && (
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 text-sm font-bold text-gray-800">Historique des listes</h2>
          <CompletionBars lists={summary.recentLists} />
        </div>
      )}

      {hasPriceData && (
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-1 text-sm font-bold text-gray-800">Évolution des prix</h2>
          <p className="mb-3 text-[11px] text-gray-400">Ingrédients que vous avez renseignés</p>
          <PriceLineChart ingredients={priceHistory} />
        </div>
      )}

      {storeComparisons.length > 0 && (
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
          <h2 className="mb-3 text-sm font-bold text-gray-800">Mes magasins</h2>
          <div className="flex flex-col gap-2">
            {storeComparisons.map((s) => (
              <div key={s.storeName} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-gray-800">{s.storeName}</span>
                  {s.storeCity && <span className="text-[11px] text-gray-400">{s.storeCity}</span>}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs font-bold text-primary">{s.reportCount} prix</span>
                  {s.avgPricePerKg !== null && (
                    <span className="text-[10px] text-gray-400">~{s.avgPricePerKg.toFixed(2)} €/kg moy.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasPriceData && storeComparisons.length === 0 && (
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
            </svg>
            <p className="text-sm font-semibold text-gray-400">Pas encore de données de prix</p>
            <p className="text-xs text-gray-400">Scannez des produits ou renseignez des prix<br/>pour voir l'évolution ici</p>
          </div>
        </div>
      )}
    </div>
  );
}
