"use client";

import { useState, useRef } from "react";
import { saveImportedRecipe } from "@/applications/recipe/application/useCases/saveImportedRecipe";
import type { ImportedRecipe, ImportedIngredient } from "@/applications/recipe/application/useCases/importRecipeFromUrl";

interface JsonImportFormProps {
  onUseAsTemplate: (recipe: ImportedRecipe) => void;
}

const EXAMPLE = JSON.stringify(
  {
    name: "Poulet rôti au citron",
    description: "Un classique savoureux et parfumé.",
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 60,
    ingredients: [
      { name: "Poulet entier", quantity: 1, unit: "pièce" },
      { name: "Citron", quantity: 2, unit: "pièce" },
      { name: "Ail", quantity: 4, unit: "gousse" },
    ],
    steps: [
      "Préchauffer le four à 200°C.",
      "Frotter le poulet avec le citron et l'ail.",
      "Enfourner 60 min en arrosant régulièrement.",
    ],
  },
  null,
  2,
);

function parseJson(raw: string): ImportedRecipe | string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "JSON invalide — vérifie la syntaxe.";
  }

  if (typeof parsed !== "object" || parsed === null) return "Le JSON doit être un objet.";
  const obj = parsed as Record<string, unknown>;

  if (typeof obj.name !== "string" || !obj.name.trim()) return "Le champ « name » (string) est requis.";

  const ingredients: ImportedIngredient[] = [];
  if (Array.isArray(obj.ingredients)) {
    for (const ing of obj.ingredients) {
      if (typeof ing !== "object" || ing === null) continue;
      const i = ing as Record<string, unknown>;
      ingredients.push({
        name: typeof i.name === "string" ? i.name : String(i.name ?? ""),
        quantity: typeof i.quantity === "number" ? i.quantity : parseFloat(String(i.quantity ?? "0")) || 0,
        unit: typeof i.unit === "string" ? i.unit : "pièce",
      });
    }
  }

  const steps: string[] = [];
  if (Array.isArray(obj.steps)) {
    for (const s of obj.steps) {
      if (typeof s === "string" && s.trim()) steps.push(s.trim());
    }
  }

  return {
    name: obj.name.trim(),
    description: typeof obj.description === "string" ? obj.description : null,
    servings: typeof obj.servings === "number" ? obj.servings : 4,
    prepTimeMinutes: typeof obj.prepTimeMinutes === "number" ? obj.prepTimeMinutes : null,
    cookTimeMinutes: typeof obj.cookTimeMinutes === "number" ? obj.cookTimeMinutes : null,
    imageUrl: typeof obj.imageUrl === "string" ? obj.imageUrl : null,
    sourceUrl: "",
    ingredients,
    steps,
  };
}

export function JsonImportForm({ onUseAsTemplate }: JsonImportFormProps) {
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<ImportedRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleParse() {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const res = parseJson(trimmed);
    if (typeof res === "string") {
      setError(res);
      setResult(null);
    } else {
      setError(null);
      setResult(res);
    }
  }

  async function handleSave() {
    if (!result) return;
    setIsSaving(true);
    const res = await saveImportedRecipe(result);
    if (res && "error" in res) setError(res.error);
    setIsSaving(false);
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
          <div className="px-5 pt-5">
            <p className="text-lg font-black text-foreground">{result.name}</p>
          </div>
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
              Ingrédients
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
            onClick={() => { setResult(null); setError(null); }}
            className="py-2 text-sm text-muted-foreground transition active:opacity-60"
          >
            Modifier le JSON
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
            Colle ton JSON de recette
          </p>
          <textarea
            ref={textareaRef}
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setError(null); }}
            placeholder={'{\n  "name": "Nom de la recette",\n  "ingredients": [...],\n  "steps": [...]\n}'}
            rows={10}
            className="w-full rounded-xl border border-border bg-muted/60 px-4 py-3 font-mono text-xs leading-relaxed outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
        <div className="flex gap-2 px-4 pb-4 pt-2">
          <button
            type="button"
            onClick={handleParse}
            disabled={!raw.trim()}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40"
          >
            Analyser
          </button>
          <button
            type="button"
            onClick={() => setShowExample((v) => !v)}
            className="rounded-xl border border-border bg-muted/60 px-3 py-2.5 text-sm font-medium text-muted-foreground transition active:scale-95"
          >
            Exemple
          </button>
        </div>
      </div>

      {showExample && (
        <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Format attendu</p>
            <button
              type="button"
              onClick={() => { setRaw(EXAMPLE); setShowExample(false); textareaRef.current?.focus(); }}
              className="text-[10px] font-semibold text-primary transition active:opacity-60"
            >
              Utiliser cet exemple
            </button>
          </div>
          <pre className="max-h-64 overflow-y-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground">{EXAMPLE}</pre>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive-light px-4 py-3.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-destructive">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="rounded-2xl bg-muted/50 px-4 py-3.5">
        <p className="text-xs font-semibold text-muted-foreground">Champs supportés</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          <code className="font-mono">name</code> · <code className="font-mono">description</code> · <code className="font-mono">servings</code> · <code className="font-mono">prepTimeMinutes</code> · <code className="font-mono">cookTimeMinutes</code> · <code className="font-mono">imageUrl</code> · <code className="font-mono">ingredients[]</code> · <code className="font-mono">steps[]</code>
        </p>
      </div>
    </div>
  );
}
