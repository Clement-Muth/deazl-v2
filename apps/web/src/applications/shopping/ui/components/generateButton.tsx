"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLingui } from "@lingui/react/macro";
import { generateShoppingList } from "@/applications/shopping/application/useCases/generateShoppingList";

interface GenerateButtonProps {
  hasExisting?: boolean;
  compact?: boolean;
}

export function GenerateButton({ hasExisting = false, compact = false }: GenerateButtonProps) {
  const { t } = useLingui();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      await generateShoppingList();
      router.push("/shopping");
    });
  }

  if (compact) {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={handleGenerate}
        className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-primary/30 transition active:scale-[0.95] disabled:opacity-60"
      >
        {isPending ? (
          <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
          </svg>
        )}
        {hasExisting ? t`Regenerate` : t`Generate`}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleGenerate}
      className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition active:scale-[0.98] disabled:opacity-60"
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
