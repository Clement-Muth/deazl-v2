"use client";

import { useTransition } from "react";
import { useLingui } from "@lingui/react/macro";
import { generateShoppingList } from "@/applications/shopping/application/useCases/generateShoppingList";

interface GenerateButtonProps {
  hasExisting?: boolean;
}

export function GenerateButton({ hasExisting = false }: GenerateButtonProps) {
  const { t } = useLingui();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => generateShoppingList())}
      className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
    >
      {isPending ? (
        <>
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {t`Generating...`}
        </>
      ) : hasExisting ? (
        t`Regenerate from planning`
      ) : (
        t`Generate from planning`
      )}
    </button>
  );
}
