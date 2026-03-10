"use client";

import { useTransition } from "react";
import { setLocale } from "@/applications/user/application/useCases/setLocale";
import type { Locale } from "@/lib/i18n/i18n";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "fr", label: "FR" },
  { value: "en", label: "EN" },
];

export function LanguageSwitcher({ current }: { current: Locale }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map(({ value, label }) => (
        <button
          key={value}
          disabled={isPending || current === value}
          onClick={() => startTransition(() => setLocale(value))}
          className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
            current === value
              ? "bg-primary text-white"
              : "text-muted-foreground/70 hover:text-gray-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
