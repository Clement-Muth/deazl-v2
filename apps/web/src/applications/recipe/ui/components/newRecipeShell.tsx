"use client";

import { useState } from "react";
import Link from "next/link";
import { RecipeForm } from "./recipeForm/recipeForm";
import { UrlImportForm } from "./urlImport/urlImportForm";
import { JsonImportForm } from "./jsonImport/jsonImportForm";
import type { ImportedRecipe } from "@/applications/recipe/application/useCases/importRecipeFromUrl";
import type { Recipe } from "@/applications/recipe/domain/entities/recipe";
import type { RecipeState } from "./recipeForm/recipeForm";

interface NewRecipeShellProps {
  createAction: (prevState: RecipeState, formData: FormData) => Promise<RecipeState>;
}

type Tab = "url" | "json" | "manual";

function importedToDefaultValues(imported: ImportedRecipe): Partial<Recipe> {
  return {
    name: imported.name,
    description: imported.description,
    servings: imported.servings,
    prepTimeMinutes: imported.prepTimeMinutes,
    cookTimeMinutes: imported.cookTimeMinutes,
    imageUrl: imported.imageUrl,
    dietaryTags: [],
    ingredients: imported.ingredients.map((ing, i) => ({
      id: `imported-${i}`,
      recipeId: "",
      customName: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      isOptional: false,
      sortOrder: i,
      productId: null,
      nutriscoreGrade: null,
      latestPrice: null,
    })),
    steps: imported.steps.map((desc, i) => ({
      id: `step-${i}`,
      recipeId: "",
      stepNumber: i + 1,
      description: desc,
    })),
  } as Partial<Recipe>;
}

export function NewRecipeShell({ createAction }: NewRecipeShellProps) {
  const [tab, setTab] = useState<Tab>("url");
  const [prefilled, setPrefilled] = useState<Partial<Recipe> | null>(null);

  if (prefilled) {
    return (
      <RecipeForm
        mode="create"
        action={createAction}
        defaultValues={prefilled as Recipe}
        backHref="/recipes/new"
        onBack={() => setPrefilled(null)}
      />
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-5 pb-2 pt-8">
        <Link
          href="/recipes"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-foreground">Nouvelle recette</h1>
      </div>

      <div className="flex gap-1 px-5 py-3">
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
            tab === "url" ? "bg-primary text-white shadow-sm" : "bg-muted/60 text-muted-foreground"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          URL
        </button>
        <button
          type="button"
          onClick={() => setTab("json")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
            tab === "json" ? "bg-primary text-white shadow-sm" : "bg-muted/60 text-muted-foreground"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          JSON
        </button>
        <button
          type="button"
          onClick={() => setTab("manual")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
            tab === "manual" ? "bg-primary text-white shadow-sm" : "bg-muted/60 text-muted-foreground"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Manuel
        </button>
      </div>

      <div className="px-4 py-2 pb-32">
        {tab === "url" ? (
          <UrlImportForm onUseAsTemplate={(imported) => setPrefilled(importedToDefaultValues(imported))} />
        ) : tab === "json" ? (
          <JsonImportForm onUseAsTemplate={(imported) => setPrefilled(importedToDefaultValues(imported))} />
        ) : (
          <RecipeForm mode="create" action={createAction} backHref="/recipes" />
        )}
      </div>
    </div>
  );
}
