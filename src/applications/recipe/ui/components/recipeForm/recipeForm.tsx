"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useLingui, Trans } from "@lingui/react/macro";
import { IngredientRow } from "./ingredientRow";
import { StepRow } from "./stepRow";
import { RecipeImagePicker } from "./recipeImagePicker";
import type { Recipe } from "@/applications/recipe/domain/entities/recipe";

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Végétarien" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten_free", label: "Sans gluten" },
  { id: "lactose_free", label: "Sans lactose" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Casher" },
  { id: "no_pork", label: "Sans porc" },
  { id: "no_seafood", label: "Sans fruits de mer" },
];

type RecipeState = { error: string } | undefined;

interface RecipeFormProps {
  mode: "create" | "edit";
  action: (prevState: RecipeState, formData: FormData) => Promise<RecipeState>;
  defaultValues?: Recipe;
  backHref: string;
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

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-2 py-5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-base text-gray-600 transition hover:bg-muted/80 active:scale-90 disabled:opacity-25"
        >
          −
        </button>
        <div className="flex w-8 flex-col items-center">
          <span className="text-base font-bold leading-tight text-foreground">
            {value === 0 ? "—" : value}
          </span>
          {suffix && value > 0 && (
            <span className="text-[9px] text-muted-foreground/70">{suffix}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(value + step)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-base text-gray-600 transition hover:bg-muted/80 active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function RecipeForm({ mode, action, defaultValues, backHref }: RecipeFormProps) {
  const { t } = useLingui();
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transDir, setTransDir] = useState<1 | -1>(1);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(defaultValues?.imageUrl ?? null);

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [servings, setServings] = useState(defaultValues?.servings ?? 4);
  const [prepTime, setPrepTime] = useState(defaultValues?.prepTimeMinutes ?? 0);
  const [cookTime, setCookTime] = useState(defaultValues?.cookTimeMinutes ?? 0);
  const [dietaryTags, setDietaryTags] = useState<string[]>(defaultValues?.dietaryTags ?? []);

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

  function goToStep(next: number) {
    setTransDir(next > step ? 1 : -1);
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(next);
      setIsTransitioning(false);
    }, 160);
  }

  function handleNext() {
    if (step === 1 && !name.trim()) {
      setNameError(t`Recipe name is required`);
      return;
    }
    if (step < 3) {
      goToStep(step + 1);
    } else {
      handleSubmit();
    }
  }

  function updateIngredient(id: string, field: keyof Omit<IngredientEntry, "id">, value: string) {
    setIngredients((prev) => prev.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing)));
  }

  function updateStepDescription(id: string, description: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, description } : s)));
  }

  function buildFormData(): FormData {
    const fd = new FormData();
    if (defaultValues?.imageUrl && !imageFile) {
      fd.append("existing_image_url", defaultValues.imageUrl);
    }
    if (imageFile) fd.append("image", imageFile);
    fd.append("name", name);
    fd.append("description", description);
    fd.append("servings", String(servings));
    if (prepTime > 0) fd.append("prep_time", String(prepTime));
    if (cookTime > 0) fd.append("cook_time", String(cookTime));
    for (const tag of dietaryTags) fd.append("dietary_tag", tag);
    for (const ing of ingredients) {
      fd.append("ingredient_name", ing.name);
      fd.append("ingredient_quantity", ing.quantity);
      fd.append("ingredient_unit", ing.unit);
    }
    for (const s of steps) {
      fd.append("step_description", s.description);
    }
    return fd;
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await action(undefined, buildFormData());
      if (result?.error) setSubmitError(result.error);
    });
  }

  const stepTitles = [t`Photo`, t`Basics`, t`Ingredients`, t`Instructions`];
  const isLast = step === 3;

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-white/70 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 pb-3 pt-5">
          {step === 0 ? (
            <Link
              href={backHref}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-gray-600 transition hover:bg-muted/80 active:scale-[0.94]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
          ) : (
            <button
              onClick={() => goToStep(step - 1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-gray-600 transition hover:bg-muted/80 active:scale-[0.94]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <h1 className="flex-1 text-center text-base font-black tracking-tight text-foreground">
            {stepTitles[step]}
          </h1>

          <button
            onClick={handleNext}
            disabled={isPending}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition active:scale-[0.96] disabled:opacity-50 ${
              isLast
                ? "bg-primary text-white shadow-sm shadow-primary/30"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isPending
              ? t`Saving…`
              : isLast
                ? mode === "create" ? t`Create` : t`Save`
                : t`Next →`}
          </button>
        </div>

        <div className="flex gap-1.5 px-4 pb-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </header>

      <div
        style={{
          transition: "opacity 160ms ease, transform 160ms ease",
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? `translateX(${transDir * 20}px)` : "translateX(0)",
        }}
        className="flex flex-col gap-4 px-4 py-5 pb-10"
      >
        {step === 0 && (
          <>
            <RecipeImagePicker
              previewUrl={imagePreview}
              onFileChange={(file) => {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
              fullHeight
            />
            <p className="text-center text-xs text-muted-foreground/70">
              <Trans>A great photo makes people want to cook your recipe</Trans>
            </p>
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="text-center text-sm font-medium text-muted-foreground/70 transition hover:text-gray-600"
            >
              <Trans>Skip for now →</Trans>
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
              <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="recipe-name" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <Trans>Recipe name</Trans>
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="recipe-name"
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setNameError(null); }}
                    placeholder={t`e.g. Chicken stir-fry`}
                    autoFocus={name === ""}
                    className={`w-full rounded-xl border bg-muted/60 px-4 py-3.5 text-sm outline-none transition placeholder:text-muted-foreground/40 focus:bg-white focus:ring-2 ${
                      nameError
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : "border-border focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {nameError && (
                    <p className="flex items-center gap-1 text-xs text-destructive">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {nameError}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="recipe-description" className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Trans>Description</Trans>
                    <span className="font-normal text-muted-foreground/40"><Trans>(optional)</Trans></span>
                  </label>
                  <textarea
                    id="recipe-description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t`A short description of this recipe…`}
                    className="w-full resize-none rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/40 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
              <div className="border-b border-border/60 px-5 py-3.5">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
                  <Trans>Details</Trans>
                </span>
              </div>
              <div className="grid grid-cols-3 divide-x divide-black/5">
                <Stepper label={t`Servings`} value={servings} onChange={setServings} min={1} step={1} />
                <Stepper label={t`Prep`} value={prepTime} onChange={setPrepTime} min={0} step={5} suffix="min" />
                <Stepper label={t`Cook`} value={cookTime} onChange={setCookTime} min={0} step={5} suffix="min" />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
              <div className="border-b border-border/60 px-5 py-3.5">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
                  <Trans>Dietary</Trans>
                </span>
              </div>
              <div className="flex flex-wrap gap-2 p-4">
                {DIETARY_OPTIONS.map((opt) => {
                  const active = dietaryTags.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setDietaryTags((prev) =>
                          active ? prev.filter((t) => t !== opt.id) : [...prev, opt.id]
                        )
                      }
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                        active
                          ? "bg-primary text-white shadow-sm shadow-primary/25"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
            <div className="border-b border-border/60 px-5 py-3.5">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
                <Trans>Ingredients</Trans>
                <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/40">
                  {ingredients.length}
                </span>
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
                  onNameChange={(v) => updateIngredient(ing.id, "name", v)}
                  onQuantityChange={(v) => updateIngredient(ing.id, "quantity", v)}
                  onUnitChange={(v) => updateIngredient(ing.id, "unit", v)}
                  onRemove={() => setIngredients((prev) => prev.filter((x) => x.id !== ing.id))}
                  canRemove={ingredients.length > 1}
                />
              ))}
            </div>
            <div className="border-t border-border/60 p-3">
              <button
                type="button"
                onClick={() =>
                  setIngredients((prev) => [...prev, { id: uid(), name: "", quantity: "", unit: "" }])
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted/60 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted active:scale-[0.99]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <Trans>Add ingredient</Trans>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <>
            <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
              <div className="border-b border-border/60 px-5 py-3.5">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
                  <Trans>Steps</Trans>
                  <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/40">
                    {steps.length}
                  </span>
                </span>
              </div>
              <div className="flex flex-col gap-2 p-3">
                {steps.map((s, i) => (
                  <StepRow
                    key={s.id}
                    index={i}
                    defaultDescription={s.description}
                    onDescriptionChange={(v) => updateStepDescription(s.id, v)}
                    onRemove={() => setSteps((prev) => prev.filter((x) => x.id !== s.id))}
                    canRemove={steps.length > 1}
                  />
                ))}
              </div>
              <div className="border-t border-border/60 p-3">
                <button
                  type="button"
                  onClick={() => setSteps((prev) => [...prev, { id: uid(), description: "" }])}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted/60 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted active:scale-[0.99]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <Trans>Add step</Trans>
                </button>
              </div>
            </div>

            {submitError && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-destructive">{submitError}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
