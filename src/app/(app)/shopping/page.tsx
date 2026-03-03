import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { getActiveShoppingList } from "@/applications/shopping/application/useCases/getActiveShoppingList";
import { ShoppingListView } from "@/applications/shopping/ui/components/shoppingListView";
import { GenerateButton } from "@/applications/shopping/ui/components/generateButton";

export default async function ShoppingPage() {
  await initLinguiFromCookie();
  const list = await getActiveShoppingList();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground"><Trans>Shopping</Trans></h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {list
              ? <Trans>{list.items.length} items</Trans>
              : <Trans>No list yet</Trans>}
          </p>
        </div>
        <GenerateButton hasExisting={!!list} />
      </div>

      {list ? (
        <ShoppingListView list={list} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-700"><Trans>No shopping list yet</Trans></p>
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
