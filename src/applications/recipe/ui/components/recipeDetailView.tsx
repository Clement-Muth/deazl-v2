"use client";

import { useState } from "react";
import { ServingsScaler } from "@/applications/recipe/ui/components/servingsScaler";
import { IngredientList } from "@/applications/recipe/ui/components/ingredientList";
import { CookMode } from "@/applications/recipe/ui/components/cookMode";
import { RecipePriceCard } from "@/applications/recipe/ui/components/recipePriceCard";
import type { Recipe } from "@/applications/recipe/domain/entities/recipe";
import type { StorePriceSummary } from "@/applications/recipe/application/useCases/getRecipePricesByStore";

interface Props {
  recipe: Recipe;
  storePrices: StorePriceSummary[];
}

export function RecipeDetailView({ recipe, storePrices }: Props) {
  const [servings, setServings] = useState(recipe.servings);
  const [cookMode, setCookMode] = useState(false);
  const multiplier = servings / recipe.servings;

  const totalCost = recipe.ingredients.reduce((sum, ing) => {
    return ing.latestPrice ? sum + ing.latestPrice.price * multiplier : sum;
  }, 0);

  return (
    <>
      {cookMode && recipe.steps.length > 0 && (
        <CookMode
          steps={recipe.steps}
          recipeName={recipe.name}
          onClose={() => setCookMode(false)}
        />
      )}

      <div className="flex flex-col gap-4 px-4 py-5">
        {recipe.ingredients.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
            <div className="border-b border-black/5">
              <ServingsScaler
                baseServings={recipe.servings}
                servings={servings}
                onChange={setServings}
              />
            </div>
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
                Ingrédients
              </h2>
              {totalCost > 0 && (
                <span className="text-xs font-semibold text-gray-500">
                  ~{totalCost.toFixed(2)} €
                </span>
              )}
            </div>
            <IngredientList
              ingredients={recipe.ingredients}
              recipeId={recipe.id}
              multiplier={multiplier}
            />
          </div>
        )}

        <RecipePriceCard stores={storePrices} />

        {recipe.steps.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-3.5">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
                Étapes
              </h2>
              <button
                type="button"
                onClick={() => setCookMode(true)}
                className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-sm shadow-primary/30 transition active:scale-[0.95]"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Mode cuisine
              </button>
            </div>
            <ol>
              {recipe.steps.map((step, i) => (
                <li
                  key={step.id}
                  className={`flex gap-4 px-5 py-4 ${
                    i < recipe.steps.length - 1 ? "border-b border-black/4" : ""
                  }`}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {step.stepNumber}
                  </span>
                  <p className="text-sm leading-relaxed text-gray-700">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </>
  );
}
