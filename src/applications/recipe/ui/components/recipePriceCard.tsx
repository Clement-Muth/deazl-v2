import { Trans } from "@lingui/react/macro";
import type { StorePriceSummary } from "@/applications/recipe/application/useCases/getRecipePricesByStore";

interface RecipePriceCardProps {
  stores: StorePriceSummary[];
}

export function RecipePriceCard({ stores }: RecipePriceCardProps) {
  if (stores.length === 0) return null;

  const cheapest = stores[0];

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
      <div className="border-b border-border/60 px-5 py-3.5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
          <Trans>Price by store</Trans>
        </h2>
      </div>
      <div className="flex flex-col divide-y divide-black/5">
        {stores.map((store, i) => {
          const isCheapest = store.storeId === cheapest.storeId && stores.length > 1;
          const coverage = Math.round((store.coveredCount / store.totalCount) * 100);
          return (
            <div
              key={store.storeId}
              className={`flex items-center justify-between px-5 py-3.5 ${isCheapest ? "bg-green-50/60" : ""}`}
            >
              <div className="flex items-center gap-3">
                {isCheapest && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
                {!isCheapest && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                    <span className="text-[9px] font-bold text-muted-foreground/70">{i + 1}</span>
                  </div>
                )}
                <div>
                  <p className={`text-sm font-semibold ${isCheapest ? "text-green-700" : "text-foreground"}`}>
                    {store.storeName}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {coverage < 100
                      ? <Trans>{store.coveredCount}/{store.totalCount} ingredients</Trans>
                      : store.storeCity}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-base font-black ${isCheapest ? "text-green-600" : "text-gray-700"}`}>
                  ~{store.totalCost.toFixed(2)} €
                </p>
                {isCheapest && stores.length > 1 && stores[1] && (
                  <p className="text-[10px] font-semibold text-green-500">
                    <Trans>-{(stores[1].totalCost - store.totalCost).toFixed(2)} €</Trans>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border/60 px-5 py-3">
        <p className="text-[10px] text-muted-foreground/40">
          <Trans>Based on prices reported by the community</Trans>
        </p>
      </div>
    </div>
  );
}
