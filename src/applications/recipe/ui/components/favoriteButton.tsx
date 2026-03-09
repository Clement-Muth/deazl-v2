"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/applications/recipe/application/useCases/toggleFavorite";

interface Props {
  recipeId: string;
  initialFavorite: boolean;
  heroBtnBg: string;
  heroText: string;
}

export function FavoriteButton({ recipeId, initialFavorite, heroBtnBg, heroText }: Props) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFavorite(recipeId);
      setIsFavorite(result.isFavorite);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-sm transition active:scale-[0.94] disabled:opacity-50"
      style={{ background: heroBtnBg, color: heroText }}
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: isFavorite ? "#f43f5e" : heroText }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
