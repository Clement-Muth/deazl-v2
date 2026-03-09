import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--font-geist-sans, system-ui, sans-serif)", backgroundColor: "#FAF9F6", color: "#1C1917", minHeight: "100vh" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "#FAF9F6EE", backdropFilter: "blur(16px)", borderBottom: "1px solid #E8E5E0" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.5rem", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#E8571C,#C94811)", flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 900, color: "#1C1917", letterSpacing: "-0.02em" }}>deazl</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, fontWeight: 500, color: "#78716C", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Retour à l'accueil
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "3rem 1.5rem 6rem" }}>
        {children}
      </main>

      <footer style={{ borderTop: "1px solid #E8E5E0", background: "#fff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 12, color: "#A8A29E" }}>© 2026 Deazl. Tous droits réservés.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            {[["Confidentialité","/confidentialite"],["Conditions","/conditions"],["Mentions légales","/mentions-legales"],["RGPD","/rgpd"],["Sécurité","/securite"]].map(([label,href]) => (
              <Link key={href} href={href} style={{ fontSize: 12, color: "#78716C", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
