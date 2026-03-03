"use client";

import { useActionState, useRef } from "react";
import { useLingui, Trans } from "@lingui/react/macro";
import { addShoppingItem } from "@/applications/shopping/application/useCases/addShoppingItem";

interface AddItemFormProps {
  listId: string;
}

export function AddItemForm({ listId }: AddItemFormProps) {
  const { t } = useLingui();
  const action = addShoppingItem.bind(null, listId);
  const [state, formAction, isPending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await formAction(fd);
        formRef.current?.reset();
      }}
      className="flex gap-2"
    >
      <input
        name="name"
        type="text"
        required
        placeholder={t`Add an item...`}
        className="flex-1 min-w-0 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
      />
      <input
        name="quantity"
        type="number"
        min="0.001"
        step="any"
        defaultValue="1"
        className="w-16 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
      />
      <input
        name="unit"
        type="text"
        placeholder={t`Unit`}
        className="w-20 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="submit"
        disabled={isPending}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white transition active:scale-[0.97] disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {state?.error && (
        <p className="absolute text-xs text-destructive mt-1">{state.error}</p>
      )}
    </form>
  );
}
