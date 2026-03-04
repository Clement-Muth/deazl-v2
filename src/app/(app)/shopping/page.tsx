import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { getActiveShoppingList } from "@/applications/shopping/application/useCases/getActiveShoppingList";
import { ShoppingListView } from "@/applications/shopping/ui/components/shoppingListView";
import { GenerateButton } from "@/applications/shopping/ui/components/generateButton";

export default async function ShoppingPage() {
  await initLinguiFromCookie();
  const list = await getActiveShoppingList();

  const checkedCount = list?.items.filter((i) => i.isChecked).length ?? 0;
  const totalCount = list?.items.length ?? 0;
  const estimatedTotal = list?.storeSummaries[0]?.totalCost ?? 0;

  return (
    <div className="relative min-h-screen bg-linear-to-b from-primary-light via-background to-background">
      <header className="sticky top-0 z-10 border-b border-black/5 bg-white/70 px-5 pb-3 pt-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">
              <Trans>Shopping</Trans>
            </h1>
            <p className="mt-0.5 text-xs font-medium text-gray-400">
              {list
                ? checkedCount === 0
                  ? estimatedTotal > 0
                    ? <Trans>{totalCount} items · ~{estimatedTotal.toFixed(2)} €</Trans>
                    : <Trans>{totalCount} items</Trans>
                  : <Trans>{checkedCount}/{totalCount} checked</Trans>
                : <Trans>No list yet</Trans>}
            </p>
          </div>
          <GenerateButton hasExisting={!!list} compact />
        </div>
      </header>

      {list ? (
        <ShoppingListView list={list} />
      ) : (
        <div className="flex flex-col items-center gap-4 px-8 pt-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/80 shadow-sm ring-1 ring-black/5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground"><Trans>No shopping list yet</Trans></p>
            <p className="mt-1 text-sm text-gray-400">
              <Trans>Generate one from your weekly planning</Trans>
            </p>
          </div>
          <GenerateButton />
        </div>
      )}
    </div>
  );
}
