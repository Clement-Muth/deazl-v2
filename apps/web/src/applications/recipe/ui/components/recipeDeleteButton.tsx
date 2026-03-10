"use client";

import { useTransition } from "react";
import { useLingui } from "@lingui/react/macro";
import { deleteRecipe } from "@/applications/recipe/application/useCases/deleteRecipe";

interface RecipeDeleteButtonProps {
  id: string;
}

export function RecipeDeleteButton({ id }: RecipeDeleteButtonProps) {
  const { t } = useLingui();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(t`Delete this recipe? This action cannot be undone.`)) return;
    startTransition(() => deleteRecipe(id));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-destructive transition hover:bg-red-50 active:scale-[0.98] disabled:opacity-50"
    >
      {isPending ? t`Deleting...` : t`Delete`}
    </button>
  );
}
