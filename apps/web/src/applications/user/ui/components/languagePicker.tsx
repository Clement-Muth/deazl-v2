"use client";

import { useTransition } from "react";
import { setLocale } from "@/applications/user/application/useCases/setLocale";
import type { Locale } from "@/lib/i18n/i18n";

const LOCALES: { value: Locale; label: string; short: string }[] = [
  { value: "fr", label: "Français", short: "FR" },
  { value: "en", label: "English", short: "EN" },
];

export function LanguagePicker({ currentLocale }: { currentLocale: Locale }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(locale: Locale) {
    if (locale === currentLocale) return;
    startTransition(async () => {
      await setLocale(locale);
    });
  }

  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-foreground">Langue</p>
      </div>
      <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
        {LOCALES.map(({ value, label, short }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleChange(value)}
            disabled={isPending}
            title={label}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition active:scale-[0.97] disabled:opacity-50 ${
              currentLocale === value
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {short}
          </button>
        ))}
      </div>
    </div>
  );
}
