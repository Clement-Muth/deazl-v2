"use client";

import { useActionState, useState } from "react";
import { useLingui, Trans } from "@lingui/react/macro";
import { IngredientRow } from "./ingredientRow";
import { StepRow } from "./stepRow";
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
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">
            <Trans>Recipe name</Trans>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={defaultValues?.name}
            placeholder={t`e.g. Chicken stir-fry`}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            <Trans>Description</Trans>
            <span className="ml-1 text-xs text-gray-400"><Trans>(optional)</Trans></span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaultValues?.description ?? ""}
            placeholder={t`A short description of this recipe...`}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="servings" className="text-sm font-medium text-gray-700">
              <Trans>Servings</Trans>
            </label>
            <input
              id="servings"
              name="servings"
              type="number"
              min="1"
              defaultValue={defaultValues?.servings ?? 4}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prep_time" className="text-sm font-medium text-gray-700">
              <Trans>Prep (min)</Trans>
            </label>
            <input
              id="prep_time"
              name="prep_time"
              type="number"
              min="0"
              defaultValue={defaultValues?.prepTimeMinutes ?? ""}
              placeholder="—"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cook_time" className="text-sm font-medium text-gray-700">
              <Trans>Cook (min)</Trans>
            </label>
            <input
              id="cook_time"
              name="cook_time"
              type="number"
              min="0"
              defaultValue={defaultValues?.cookTimeMinutes ?? ""}
              placeholder="—"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700"><Trans>Ingredients</Trans></h3>
        <div className="flex flex-col gap-2">
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
        <button
          type="button"
          onClick={addIngredient}
          className="self-start flex items-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 transition hover:border-primary hover:text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <Trans>Add ingredient</Trans>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-gray-700"><Trans>Steps</Trans></h3>
        <div className="flex flex-col gap-2">
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
        <button
          type="button"
          onClick={addStep}
          className="self-start flex items-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 transition hover:border-primary hover:text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <Trans>Add step</Trans>
        </button>
      </div>

      {state?.error && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-destructive">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-4 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending
          ? t`Saving...`
          : mode === "create"
            ? t`Create recipe`
            : t`Save changes`}
      </button>
    </form>
  );
}
