"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const STEPS = [
  { path: "/onboarding/welcome",   label: null,            step: 0, back: null },
  { path: "/onboarding/household", label: "Étape 1 sur 2", step: 1, back: "/onboarding/welcome" },
  { path: "/onboarding/stores",    label: "Étape 2 sur 2", step: 2, back: "/onboarding/household" },
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = STEPS.find((s) => pathname.startsWith(s.path)) ?? STEPS[0];

  if (current.step === 0) {
    return <div className="min-h-screen bg-white overflow-hidden">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <div className="relative px-6 pt-14">

        <div className="mb-6 flex items-center gap-3">
          {current.back && (
            <Link
              href={current.back}
              className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center text-gray-500 active:text-gray-900 active:scale-90 transition-all"
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
                  i <= current.step + 1 ? "bg-primary" : "bg-gray-100"
                }`}
              />
            ))}
          </div>
        </div>

        {current.label && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary animate-fade-up [animation-delay:50ms]">
            {current.label}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}
