"use client";

import { useState } from "react";
import { ServingsScaler } from "@/applications/recipe/ui/components/servingsScaler";
import { IngredientList } from "@/applications/recipe/ui/components/ingredientList";
import { CookMode } from "@/applications/recipe/ui/components/cookMode";
import { RecipePriceCard } from "@/applications/recipe/ui/components/recipePriceCard";
import type { RecipeIngredient, RecipeStep } from "@/applications/recipe/domain/entities/recipe";
import type { StorePriceSummary } from "@/applications/recipe/application/useCases/getRecipePricesByStore";

interface Props {
  recipeId: string;
  recipeName: string;
  baseServings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  storePrices: StorePriceSummary[];
}

export function RecipeDetailView({ recipeId, recipeName, baseServings, ingredients, steps, storePrices }: Props) {
  const [servings, setServings] = useState(baseServings);
  const [cookMode, setCookMode] = useState(false);
  const multiplier = servings / baseServings;

  const totalCost = ingredients.reduce((sum, ing) => {
    return ing.latestPrice ? sum + ing.latestPrice.price * multiplier : sum;
  }, 0);

  return (
    <>
      {cookMode && steps.length > 0 && (
        <CookMode
          steps={steps}
          recipeName={recipeName}
          onClose={() => setCookMode(false)}
        />
      )}

      <div className="flex flex-col gap-3 px-4 pt-4">
        {ingredients.length > 0 && (
          <>
            <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
              <ServingsScaler
                baseServings={baseServings}
                servings={servings}
                onChange={setServings}
              />
            </div>

            <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                  Ingrédients
                </h2>
                {totalCost > 0 && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    ~{totalCost.toFixed(2)} €
                  </span>
                )}
              </div>
              <IngredientList
                ingredients={ingredients}
                recipeId={recipeId}
                multiplier={multiplier}
              />
            </div>
          </>
        )}

        <RecipePriceCard stores={storePrices} />

        {steps.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
            <div className="border-b border-black/5 px-5 py-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                Préparation
              </h2>
            </div>
            <ol className="divide-y divide-black/4">
              {steps.map((step) => (
                <li key={step.id} className="flex gap-4 px-5 py-5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                    {step.stepNumber}
                  </span>
                  <p className="text-sm leading-relaxed text-gray-700">{step.description}</p>
                </li>
              ))}
            </ol>
            <div className="border-t border-black/5 p-4">
              <button
                type="button"
                onClick={() => setCookMode(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-bold text-white shadow-md shadow-primary/20 transition active:scale-[0.97]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Mode cuisine
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
