"use client";

import { useRef } from "react";
import { Trans } from "@lingui/react/macro";
import { BottomSheet, SheetHandle, type BottomSheetHandle } from "@/shared/components/ui/bottomSheet";
import type { ShoppingItem } from "@/applications/shopping/domain/entities/shopping";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";

interface ItemDetailSheetProps {
  item: ShoppingItem;
  userStores: UserStoreItem[];
  activeStoreId?: string | null;
  onClose: () => void;
  onAddPrice: (store?: UserStoreItem) => void;
}

export function ItemDetailSheet({ item, userStores, activeStoreId, onClose, onAddPrice }: ItemDetailSheetProps) {
  const bsRef = useRef<BottomSheetHandle>(null);

  const qty = item.quantity % 1 === 0
    ? item.quantity
    : parseFloat(item.quantity.toFixed(2).replace(/\.?0+$/, ""));

  const cheapest = item.allStorePrices.length > 0
    ? item.allStorePrices.reduce((min, p) => p.estimatedCost < min.estimatedCost ? p : min)
    : null;

  const activeStorePrice = activeStoreId
    ? item.allStorePrices.find((p) => p.storeId === activeStoreId)
    : null;

  const savings = cheapest && activeStorePrice && activeStorePrice.storeId !== cheapest.storeId
    ? activeStorePrice.estimatedCost - cheapest.estimatedCost
    : 0;

  function handleAddPrice(store?: UserStoreItem) {
    bsRef.current?.dismiss();
    onAddPrice(store);
  }

  return (
    <BottomSheet ref={bsRef} onClose={onClose} maxHeight="78vh">
      <SheetHandle>
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">{item.customName}</h3>
            <p className="text-xs text-muted-foreground/60">{qty} {item.unit}</p>
          </div>
          <button
            type="button"
            onClick={() => bsRef.current?.dismiss()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </SheetHandle>

      <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-8 pt-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            <Trans>Prix par magasin</Trans>
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/50">
            <Trans>Estimation pour {qty} {item.unit} · données communautaires</Trans>
          </p>
        </div>

        {userStores.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/40 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground/70">
              <Trans>Ajoutez des magasins dans votre profil pour comparer les prix.</Trans>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {userStores.map((store) => {
              const storePrice = item.allStorePrices.find((p) => p.storeId === store.id);
              const isCheapest = cheapest?.storeId === store.id && item.allStorePrices.length > 1;
              const isActive = activeStoreId === store.id;

              return (
                <div
                  key={store.id}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                    isActive
                      ? "bg-primary/6 ring-2 ring-primary/25"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                      {store.name}
                    </p>
                    {isActive && (
                      <p className="text-[10px] font-medium text-primary/70"><Trans>Magasin actif</Trans></p>
                    )}
                  </div>
                  {storePrice ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-base font-bold ${isCheapest ? "text-green-600" : isActive ? "text-primary" : "text-foreground"}`}>
                        ~{storePrice.estimatedCost.toFixed(2)} €
                      </span>
                      {isCheapest && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          <Trans>Moins cher</Trans>
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddPrice(store)}
                      className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600 transition hover:bg-amber-100 active:scale-95"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <Trans>Ajouter</Trans>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {savings > 0 && cheapest && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-green-50 px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <p className="text-xs text-green-700">
              <Trans>
                <strong>{cheapest.storeName}</strong> est moins cher de <strong>{savings.toFixed(2)} €</strong> pour cet article
              </Trans>
            </p>
          </div>
        )}

        {item.allStorePrices.length === 0 && userStores.length > 0 && (
          <button
            type="button"
            onClick={() => handleAddPrice(undefined)}
            className="rounded-2xl bg-primary py-3 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <Trans>Ajouter un prix</Trans>
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
