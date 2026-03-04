"use client";

import { useActionState, useState } from "react";
import { useLingui, Trans } from "@lingui/react/macro";
import { IngredientRow } from "./ingredientRow";
import { StepRow } from "./stepRow";
import { RecipeImagePicker } from "./recipeImagePicker";
import type { Recipe } from "@/applications/recipe/domain/entities/recipe";

type RecipeState = { error: string } | undefined;

interface RecipeFormProps {
  mode: "create" | "edit";
  action: (prevState: RecipeState, formData: FormData) => Promise<RecipeState>;
  defaultValues?: Recipe;
}

interface IngredientEntry {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

interface StepEntry {
  id: string;
  description: string;
}

let counter = 0;
function uid() {
  return `entry-${++counter}`;
}

export function RecipeForm({ mode, action, defaultValues }: RecipeFormProps) {
  const { t } = useLingui();
  const [state, formAction, isPending] = useActionState(action, undefined);

  const [ingredients, setIngredients] = useState<IngredientEntry[]>(
    defaultValues?.ingredients.length
      ? defaultValues.ingredients.map((ing) => ({
          id: uid(),
          name: ing.customName,
          quantity: String(ing.quantity),
          unit: ing.unit,
        }))
      : [{ id: uid(), name: "", quantity: "", unit: "" }]
  );

  const [steps, setSteps] = useState<StepEntry[]>(
    defaultValues?.steps.length
      ? defaultValues.steps.map((s) => ({ id: uid(), description: s.description }))
      : [{ id: uid(), description: "" }]
  );

  function addIngredient() {
    setIngredients((prev) => [...prev, { id: uid(), name: "", quantity: "", unit: "" }]);
  }

  function removeIngredient(id: string) {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  }

  function addStep() {
    setSteps((prev) => [...prev, { id: uid(), description: "" }]);
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">

      {defaultValues?.imageUrl && (
        <input type="hidden" name="existing_image_url" value={defaultValues.imageUrl} />
      )}

      <RecipeImagePicker defaultImageUrl={defaultValues?.imageUrl} />

      <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
        <div className="border-b border-black/5 px-5 py-3.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
            <Trans>General</Trans>
          </span>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-gray-500">
              <Trans>Recipe name</Trans>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={defaultValues?.name}
              placeholder={t`e.g. Chicken stir-fry`}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
              <Trans>Description</Trans>
              <span className="font-normal text-gray-300"><Trans>(optional)</Trans></span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={defaultValues?.description ?? ""}
              placeholder={t`A short description of this recipe…`}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
        <div className="border-b border-black/5 px-5 py-3.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
            <Trans>Details</Trans>
          </span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-black/5">
          <div className="flex flex-col items-center gap-1 px-3 py-4">
            <label htmlFor="servings" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <Trans>Servings</Trans>
            </label>
            <input
              id="servings"
              name="servings"
              type="number"
              min="1"
              defaultValue={defaultValues?.servings ?? 4}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2.5 text-center text-sm font-semibold outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-col items-center gap-1 px-3 py-4">
            <label htmlFor="prep_time" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <Trans>Prep</Trans>
            </label>
            <div className="flex w-full items-center gap-1">
              <input
                id="prep_time"
                name="prep_time"
                type="number"
                min="0"
                defaultValue={defaultValues?.prepTimeMinutes ?? ""}
                placeholder="—"
                className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-2 py-2.5 text-center text-sm font-semibold outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
              <span className="shrink-0 text-xs text-gray-300">min</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 px-3 py-4">
            <label htmlFor="cook_time" className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <Trans>Cook</Trans>
            </label>
            <div className="flex w-full items-center gap-1">
              <input
                id="cook_time"
                name="cook_time"
                type="number"
                min="0"
                defaultValue={defaultValues?.cookTimeMinutes ?? ""}
                placeholder="—"
                className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-2 py-2.5 text-center text-sm font-semibold outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
              <span className="shrink-0 text-xs text-gray-300">min</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
        <div className="border-b border-black/5 px-5 py-3.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
            <Trans>Ingredients</Trans>
            <span className="ml-2 font-normal normal-case tracking-normal text-gray-300">{ingredients.length}</span>
          </span>
        </div>
        <div className="flex flex-col gap-2 p-3">
          {ingredients.map((ing, i) => (
            <IngredientRow
              key={ing.id}
              index={i}
              defaultName={ing.name}
              defaultQuantity={ing.quantity}
              defaultUnit={ing.unit}
              onRemove={() => removeIngredient(ing.id)}
              canRemove={ingredients.length > 1}
            />
          ))}
        </div>
        <div className="border-t border-black/5 p-3">
          <button
            type="button"
            onClick={addIngredient}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-50 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 active:scale-[0.99]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <Trans>Add ingredient</Trans>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
        <div className="border-b border-black/5 px-5 py-3.5">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
            <Trans>Steps</Trans>
            <span className="ml-2 font-normal normal-case tracking-normal text-gray-300">{steps.length}</span>
          </span>
        </div>
        <div className="flex flex-col gap-2 p-3">
          {steps.map((step, i) => (
            <StepRow
              key={step.id}
              index={i}
              defaultDescription={step.description}
              onRemove={() => removeStep(step.id)}
              canRemove={steps.length > 1}
            />
          ))}
        </div>
        <div className="border-t border-black/5 p-3">
          <button
            type="button"
            onClick={addStep}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-50 py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 active:scale-[0.99]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <Trans>Add step</Trans>
          </button>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-destructive">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-white shadow-sm shadow-primary/30 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending
          ? t`Saving…`
          : mode === "create"
            ? t`Create recipe`
            : t`Save changes`}
      </button>
    </form>
  );
}
