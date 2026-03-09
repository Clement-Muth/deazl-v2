"use client";

import { useState, useTransition } from "react";
import { toggleRecipePublic } from "@/applications/recipe/application/useCases/toggleRecipePublic";

interface Props {
  recipeId: string;
  initialPublic: boolean;
  heroBtnBg: string;
  heroText: string;
}

export function ShareRecipeButton({ recipeId, initialPublic, heroBtnBg, heroText }: Props) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function copyLink() {
    const url = `${window.location.origin}/r/${recipeId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleClick() {
    if (isPublic) {
      copyLink();
      return;
    }
    startTransition(async () => {
      const result = await toggleRecipePublic(recipeId);
      setIsPublic(result.isPublic);
      if (result.isPublic) copyLink();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-sm transition active:scale-[0.94] disabled:opacity-50"
      style={{ background: heroBtnBg, color: heroText }}
      aria-label="Partager"
    >
      {copied ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
  );
}
