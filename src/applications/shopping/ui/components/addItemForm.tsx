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
    <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
      <div className="border-b border-black/5 px-5 py-3.5">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
          <Trans>Add item</Trans>
        </span>
      </div>
      <form
        ref={formRef}
        action={async (fd) => {
          await formAction(fd);
          formRef.current?.reset();
        }}
        className="flex items-center gap-2 px-4 py-3"
      >
        <input
          name="name"
          type="text"
          required
          placeholder={t`Item name...`}
          className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
        />
        <input
          name="quantity"
          type="number"
          min="0.001"
          step="any"
          defaultValue="1"
          className="w-14 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
        />
        <input
          name="unit"
          type="text"
          placeholder={t`Unit`}
          className="w-16 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition active:scale-[0.95] disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </form>
      {state?.error && (
        <p className="px-5 pb-3 text-xs text-destructive">{state.error}</p>
      )}
    </div>
  );
}
