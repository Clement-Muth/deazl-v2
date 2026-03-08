"use client";

import { useState, useTransition } from "react";
import { importRecipeFromUrl, type ImportedRecipe } from "@/applications/recipe/application/useCases/importRecipeFromUrl";
import { saveImportedRecipe } from "@/applications/recipe/application/useCases/saveImportedRecipe";

interface UrlImportFormProps {
  onUseAsTemplate: (recipe: ImportedRecipe) => void;
}

const SUGGESTIONS = ["marmiton.org", "750g.com", "cuisineaz.com", "allrecipes.com"];

export function UrlImportForm({ onUseAsTemplate }: UrlImportFormProps) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ImportedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, startParsing] = useTransition();
  const [isSaving, startSaving] = useTransition();

  function handleParse() {
    if (!url.trim()) return;
    setError(null);
    setResult(null);
    startParsing(async () => {
      const res = await importRecipeFromUrl(url);
      if ("error" in res) {
        setError(res.error);
      } else {
        setResult(res.data);
      }
    });
  }

  function handleSave() {
    if (!result) return;
    startSaving(async () => {
      const res = await saveImportedRecipe(result);
      if (res && "error" in res) setError(res.error);
    });
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
          {result.imageUrl && (
            <div className="relative h-44 w-full overflow-hidden">
              <img src={result.imageUrl} alt={result.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-4">
                <p className="text-lg font-black leading-tight text-white">{result.name}</p>
              </div>
            </div>
          )}

          {!result.imageUrl && (
            <div className="px-5 pt-5">
              <p className="text-lg font-black text-foreground">{result.name}</p>
            </div>
          )}

          {result.description && (
            <p className="line-clamp-2 px-5 py-3 text-sm text-muted-foreground">{result.description}</p>
          )}

          <div className="grid grid-cols-3 divide-x divide-border/50 border-t border-border/50">
            <div className="flex flex-col items-center py-3">
              <span className="text-base font-black text-foreground">{result.servings}</span>
              <span className="text-[10px] text-muted-foreground">portions</span>
            </div>
            <div className="flex flex-col items-center py-3">
              <span className="text-base font-black text-foreground">{result.ingredients.length}</span>
              <span className="text-[10px] text-muted-foreground">ingrédients</span>
            </div>
            <div className="flex flex-col items-center py-3">
              <span className="text-base font-black text-foreground">{result.steps.length}</span>
              <span className="text-[10px] text-muted-foreground">étapes</span>
            </div>
          </div>
        </div>

        {result.ingredients.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
            <p className="border-b border-border/50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Ingrédients détectés
            </p>
            <div className="max-h-48 overflow-y-auto">
              {result.ingredients.map((ing, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? "border-t border-border/40" : ""}`}>
                  <span className="min-w-[3.5rem] text-xs font-bold tabular-nums text-primary">
                    {ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(2)} {ing.unit !== "pièce" ? ing.unit : ""}
                  </span>
                  <span className="text-sm text-foreground">{ing.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-destructive-light px-4 py-3 text-sm font-medium text-destructive">{error}</p>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? "Enregistrement…" : "Enregistrer la recette"}
          </button>
          <button
            type="button"
            onClick={() => onUseAsTemplate(result)}
            className="w-full rounded-2xl border border-border py-3.5 text-sm font-semibold text-foreground transition active:scale-[0.98]"
          >
            Modifier avant d'enregistrer
          </button>
          <button
            type="button"
            onClick={() => { setResult(null); setUrl(""); }}
            className="py-2 text-sm text-muted-foreground transition active:opacity-60"
          >
            Changer d'URL
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
        <div className="px-4 pt-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Colle l'URL de la recette
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleParse()}
              placeholder="https://www.marmiton.org/recettes/..."
              className="flex-1 rounded-xl border border-border bg-muted/60 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <button
              type="button"
              onClick={handleParse}
              disabled={!url.trim() || isParsing}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40"
            >
              {isParsing ? (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : "Importer"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 px-4 pb-4 pt-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setUrl(`https://www.${s}/`)}
              className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted/80"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive-light px-4 py-3.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-destructive">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="rounded-2xl bg-muted/50 px-4 py-3.5">
        <p className="text-xs font-semibold text-muted-foreground">Fonctionne avec</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Marmiton · 750g · CuisineAZ · AllRecipes · BBC Food · Serious Eats · et la plupart des blogs culinaires</p>
      </div>
    </div>
  );
}
