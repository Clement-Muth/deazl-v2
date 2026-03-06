"use client";

import { useRef, useLayoutEffect } from "react";
import { useLingui } from "@lingui/react/macro";

interface StepRowProps {
  index: number;
  defaultDescription?: string;
  onRemove: () => void;
  canRemove: boolean;
  onDescriptionChange?: (v: string) => void;
}

export function StepRow({ index, defaultDescription = "", onRemove, canRemove, onDescriptionChange }: StepRowProps) {
  const { t } = useLingui();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    e.currentTarget.style.height = "auto";
    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
    onDescriptionChange?.(e.currentTarget.value);
  }

  return (
    <div className="flex gap-3 rounded-2xl bg-muted/60 p-3">
      <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {index + 1}
      </span>
      <textarea
        ref={textareaRef}
        name="step_description"
        defaultValue={defaultDescription}
        placeholder={t`Describe this step…`}
        rows={2}
        onChange={handleChange}
        className="flex-1 min-w-0 resize-none overflow-hidden rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
        aria-label={t`Step ${index + 1}`}
      />
      <button
        type="button"
        onClick={onRemove}
        className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground/40 transition hover:bg-red-50 hover:text-destructive active:scale-90 ${!canRemove ? "invisible" : ""}`}
        aria-label={t`Remove step ${index + 1}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
