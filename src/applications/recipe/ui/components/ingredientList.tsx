"use client";

import { useState, useTransition } from "react";
import { Trans } from "@lingui/react/macro";
import { unlinkIngredient } from "@/applications/catalog/application/useCases/unlinkIngredient";
import { NutriScoreBadge } from "@/applications/catalog/ui/components/nutriscoreBadge";
import { ProductSearchSheet } from "@/applications/catalog/ui/components/productSearchSheet";
import type { RecipeIngredient } from "@/applications/recipe/domain/entities/recipe";

interface IngredientListProps {
  ingredients: RecipeIngredient[];
  recipeId: string;
}

export function IngredientList({ ingredients, recipeId }: IngredientListProps) {
  const [openIngredientId, setOpenIngredientId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const openIngredient = ingredients.find((i) => i.id === openIngredientId);

  function handleUnlink(ingredientId: string) {
    startTransition(() => unlinkIngredient(ingredientId, recipeId));
  }

  return (
    <>
      <ul>
        {ingredients.map((ing, i) => (
          <li
            key={ing.id}
            className={`flex items-center gap-3 px-5 py-3.5 ${
              i < ingredients.length - 1 ? "border-b border-black/4" : ""
            }`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-sm text-foreground">{ing.customName}</span>
              {ing.nutriscoreGrade && (
                <NutriScoreBadge grade={ing.nutriscoreGrade} />
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm font-medium text-gray-400">
                {ing.quantity} {ing.unit}
              </span>

              {ing.productId ? (
                <button
                  type="button"
                  onClick={() => handleUnlink(ing.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-primary/50 transition hover:bg-primary/10 hover:text-primary"
                  title="Unlink product"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpenIngredientId(ing.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition hover:bg-gray-100 hover:text-gray-500"
                  title="Link to a product"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {openIngredient && (
        <ProductSearchSheet
          ingredientId={openIngredient.id}
          ingredientName={openIngredient.customName}
          recipeId={recipeId}
          onClose={() => setOpenIngredientId(null)}
        />
      )}
    </>
  );
}
