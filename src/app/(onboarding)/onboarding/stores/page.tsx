"use client";

import { useState } from "react";
import { useLingui, Trans, Plural } from "@lingui/react/macro";
import { completeOnboarding } from "@/applications/user/application/useCases/completeOnboarding";

const STORES = [
  "Carrefour", "Leclerc", "Lidl", "Intermarché",
  "Aldi", "Monoprix", "Super U", "Casino", "Picard", "Biocoop",
];

export default function StoresPage() {
  const { t } = useLingui();
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(store: string) {
    setSelected((prev) =>
      prev.includes(store) ? prev.filter((s) => s !== store) : [...prev, store]
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white">

      <div className="pointer-events-none absolute right-12 bottom-48 h-2 w-2 rounded-full bg-primary/20 animate-fade-in [animation-delay:150ms]" />
      <div className="pointer-events-none absolute left-24 top-44 h-1.5 w-1.5 rounded-full bg-primary/20 animate-fade-in [animation-delay:180ms]" />

      <div className="px-6">

        <div className="relative mb-8 mt-2">
          <h1 className="text-[28px] font-black leading-tight tracking-tight text-gray-900 animate-fade-up [animation-delay:80ms]">
            <Trans>Your usual<br />stores</Trans>
          </h1>
          <p className="mt-2 text-sm text-gray-400 animate-fade-up [animation-delay:160ms]">
            <Trans>To compare prices as accurately as possible.</Trans>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {STORES.map((store, index) => {
            const isSelected = selected.includes(store);
            return (
              <button
                key={store}
                type="button"
                onClick={() => toggle(store)}
                className={`animate-fade-up flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? "border-primary bg-primary text-white shadow-sm shadow-primary/20"
                    : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                }`}
                style={{ animationDelay: `${280 + index * 40}ms` }}
              >
                {isSelected && (
                  <svg
                    className="animate-scale-in"
                    width="12" height="12" viewBox="0 0 24 24"
                    fill="none" stroke="white" strokeWidth="3.5"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {store}
              </button>
            );
          })}
        </div>

        <div className="h-40" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 animate-fade-up [animation-delay:680ms]">
        <div className="h-8 bg-linear-to-t from-white to-transparent" />
        <div className="bg-white px-6 pb-10 pt-1">
          {selected.length > 0 && (
            <p className="mb-2.5 text-center text-xs font-medium text-gray-400">
              <Plural
                value={selected.length}
                one="# store selected"
                other="# stores selected"
              />
            </p>
          )}
          <form action={completeOnboarding}>
            {selected.map((store) => (
              <input key={store} type="hidden" name="stores" value={store} />
            ))}
            <button
              type="submit"
              className="flex w-full items-center justify-between rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-white transition active:scale-[0.98]"
            >
              <span>{selected.length === 0 ? t`Skip this step` : t`Start`}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
