"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const leftItems = [
  {
    href: "/planning",
    label: "Planning",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/recipes",
    label: "Recettes",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 0 1 7-7z" />
        <path d="M8 18h8" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
];

const rightItems = [
  {
    href: "/shopping",
    label: "Courses",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profil",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function NavBar() {
  const pathname = usePathname();
  const isScanActive = pathname.startsWith("/scan");

  function NavItem({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
    const isActive = pathname.startsWith(href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 rounded-full transition-all duration-300 active:scale-90 ${
          isActive
            ? "bg-primary px-4 py-2.5 text-white shadow-md shadow-primary/25"
            : "px-2.5 py-2.5 text-muted-foreground/60 hover:text-muted-foreground"
        }`}
      >
        {icon}
        {isActive && (
          <span className="whitespace-nowrap text-[12px] font-bold leading-none">
            {label}
          </span>
        )}
      </Link>
    );
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 px-2 pb-safe md:hidden">
      <div className="mb-3 flex w-full items-center justify-around gap-1 rounded-3xl bg-white px-2 py-3 shadow-xl shadow-black/10 ring-1 ring-black/6">
        {leftItems.map((item) => <NavItem key={item.href} {...item} />)}

        <Link
          href="/scan"
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300 active:scale-90 ${
            isScanActive
              ? "bg-foreground text-background shadow-lg"
              : "bg-foreground/8 text-foreground hover:bg-foreground/12"
          }`}
          aria-label="Scanner"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
            <line x1="7" y1="8" x2="7" y2="16"/><line x1="10.5" y1="8" x2="10.5" y2="16"/>
            <line x1="14" y1="8" x2="14" y2="16"/><line x1="17" y1="8" x2="17" y2="16"/>
          </svg>
        </Link>

        {rightItems.map((item) => <NavItem key={item.href} {...item} />)}
      </div>
    </nav>
  );
}
