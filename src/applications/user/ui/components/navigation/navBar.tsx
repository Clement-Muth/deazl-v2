"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLingui } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";

const navItems = [
  {
    href: "/planning",
    label: msg`Planning`,
    paths: ["M3 4h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M16 2v4M8 2v4M1 10h22", "M8 14h.01M12 14h.01M16 14h.01"],
  },
  {
    href: "/recipes",
    label: msg`Recipes`,
    paths: ["M12 2a7 7 0 0 1 7 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 0 1 7-7z", "M8 18h8", "M9 21h6"],
  },
  {
    href: "/shopping",
    label: msg`Shopping`,
    paths: ["M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z", "M3 6h18", "M16 10a4 4 0 0 1-8 0"],
  },
  {
    href: "/pantry",
    label: msg`Fridge`,
    paths: ["M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z", "M5 10h14", "M9 6v2", "M9 14v4"],
  },
];

export function NavBar() {
  const { t } = useLingui();
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-5 pb-safe">
      <div className="flex items-center justify-around rounded-2xl bg-white px-2 py-2 shadow-xl shadow-black/10 border border-gray-100">
        {navItems.map(({ href, label, paths }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all ${
                isActive ? "bg-primary" : ""
              }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isActive ? "white" : "#9CA3AF"}
                strokeWidth={isActive ? "2" : "1.8"}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {paths.map((d, i) => <path key={i} d={d} />)}
              </svg>
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? "text-white" : "text-gray-400"}`}>
                {t(label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
