"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLingui } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";

const navItems = [
  {
    href: "/planning",
    label: msg`Planning`,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "#9CA3AF"} strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/recipes",
    label: msg`Recipes`,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "#9CA3AF"} strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 0 1 7-7z" />
        <path d="M8 18h8" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
  {
    href: "/shopping",
    label: msg`Shopping`,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "#9CA3AF"} strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    href: "/scan",
    label: msg`Scan`,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "#9CA3AF"} strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        <line x1="7" y1="8" x2="7" y2="16"/><line x1="10.5" y1="8" x2="10.5" y2="16"/><line x1="14" y1="8" x2="14" y2="16"/><line x1="17" y1="8" x2="17" y2="16"/>
      </svg>
    ),
  },
  {
    href: "/analytics",
    label: msg`Analytics`,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "#9CA3AF"} strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
      </svg>
    ),
  },
  {
    href: "/profile",
    label: msg`Profile`,
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "#9CA3AF"} strokeWidth={active ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function NavBar() {
  const { t } = useLingui();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pb-safe">
      <div className="flex items-center justify-around rounded-2xl border border-black/5 bg-white/90 px-2 py-2 shadow-xl shadow-black/10 backdrop-blur-xl">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all active:scale-[0.93] ${
                isActive ? "bg-primary" : ""
              }`}
            >
              <span>{icon(isActive)}</span>
              <span className={`text-[10px] font-bold tracking-wide ${
                isActive ? "text-white" : "text-gray-400"
              }`}>
                {t(label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
