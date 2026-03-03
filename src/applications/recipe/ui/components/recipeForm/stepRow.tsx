"use client";

import { useLingui } from "@lingui/react/macro";

interface StepRowProps {
  index: number;
  defaultDescription?: string;
  onRemove: () => void;
  canRemove: boolean;
}

export function StepRow({ index, defaultDescription = "", onRemove, canRemove }: StepRowProps) {
  const { t } = useLingui();

  return (
    <div className="flex gap-2 items-start">
      <span className="shrink-0 mt-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {index + 1}
      </span>
      <textarea
        name="step_description"
        defaultValue={defaultDescription}
        placeholder={t`Describe this step...`}
        rows={2}
        className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 resize-none"
        aria-label={t`Step ${index + 1}`}
      />
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 mt-2 rounded-xl p-2 text-gray-400 transition hover:bg-red-50 hover:text-destructive"
          aria-label={t`Remove step ${index + 1}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
