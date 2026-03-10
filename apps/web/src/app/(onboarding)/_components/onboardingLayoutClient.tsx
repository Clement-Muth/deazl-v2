"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLingui } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { LanguageSwitcher } from "@/shared/components/languageSwitcher";
import type { Locale } from "@/lib/i18n/i18n";

const STEPS = [
  { path: "/onboarding/welcome",   label: null,              step: 0, back: null },
  { path: "/onboarding/household", label: msg`Step 1 of 2`, step: 1, back: "/onboarding/welcome" },
  { path: "/onboarding/stores",    label: msg`Step 2 of 2`, step: 2, back: "/onboarding/household" },
];

export function OnboardingLayoutClient({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const { t } = useLingui();
  const pathname = usePathname();
  const current = STEPS.find((s) => pathname.startsWith(s.path)) ?? STEPS[0];

  if (current.step === 0) {
    return (
      <div className="relative min-h-screen bg-white overflow-hidden">
        <div className="absolute right-4 top-4 z-10">
          <LanguageSwitcher current={locale} />
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <div className="relative px-6 pt-14">
        <div className="mb-6 flex items-center gap-3">
          {current.back && (
            <Link
              href={current.back}
              className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground active:text-gray-900 active:scale-90 transition-all"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
          )}
          <div className="flex flex-1 gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-0.75 flex-1 rounded-full transition-colors duration-500 ${
                  i <= current.step + 1 ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <LanguageSwitcher current={locale} />
        </div>

        {current.label && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary animate-fade-up [animation-delay:50ms]">
            {t(current.label)}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
