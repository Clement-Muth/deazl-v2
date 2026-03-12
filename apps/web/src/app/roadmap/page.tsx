import type { Metadata } from "next";
import Link from "next/link";
import { DM_Serif_Display } from "next/font/google";

export const metadata: Metadata = {
  title: "Roadmap — Deazl",
  description: "Découvrez les fonctionnalités disponibles et ce qui arrive prochainement sur Deazl.",
};

const serif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif-display",
  display: "swap",
});

const available = [
  "Planning de repas hebdomadaire",
  "Import de recettes depuis n'importe quelle URL",
  "Liste de courses auto-générée depuis le planning",
  "Comparaison de prix entre magasins",
  "Gestion du stock & alertes d'expiration",
  "Scan de codes-barres (produits)",
  "Mode courses en temps réel (prix live + total à la caisse)",
  "Split de frais entre membres du foyer",
  "Gestion ticket restaurant / carte resto",
  "Partage familial en temps réel",
  "App native Android",
  "Favoris, partage public de recettes",
];

const inProgress = [
  "App iOS sur l'App Store",
  "App Android sur le Play Store",
  "Suggestions d'alternatives (santé / rapport qualité-prix)",
  "Alertes promotions en magasin",
  "Historique des dépenses et analytics avancés",
];

const planned = [
  "Recommandations IA (que cuisiner avec le stock disponible)",
  "Analyse nutritionnelle des repas planifiés",
  "Intégration livraison / drive (Leclerc, Carrefour...)",
  "Planification multi-semaines",
  "Mode offline complet",
];

export default function RoadmapPage() {
  return (
    <div
      className={serif.variable}
      style={{
        fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
        backgroundColor: "#FAF9F6",
        color: "#1C1917",
        overflowX: "hidden",
        minHeight: "100vh",
      }}
    >
      <style>{`
        .rm-nav-links { display: none; }
        @media (min-width: 768px) { .rm-nav-links { display: flex; } }
        .rm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem; }
        .rm-section-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
      `}</style>

      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "#FAF9F6EE",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #E8E5E0",
        }}
      >
        <div
          style={{
            maxWidth: "1152px",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg,#E8571C,#C94811)",
                boxShadow: "0 2px 8px #E8571C30",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.02em", color: "#1C1917" }}>deazl</span>
          </Link>

          <div className="rm-nav-links" style={{ alignItems: "center", gap: "2rem" }}>
            {[["/#features", "Fonctionnalités"], ["/#how", "Comment ça marche"], ["/#faq", "FAQ"], ["/roadmap", "Roadmap"]].map(([href, label]) => (
              <a
                key={href}
                href={href}
                style={{
                  fontSize: 14,
                  fontWeight: href === "/roadmap" ? 700 : 500,
                  color: href === "/roadmap" ? "#E8571C" : "#78716C",
                  textDecoration: "none",
                }}
              >
                {label}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 600, padding: "0.5rem 1rem", borderRadius: 12, color: "#78716C", textDecoration: "none" }}>
              Connexion
            </Link>
            <Link
              href="/register"
              style={{
                fontSize: 14,
                fontWeight: 700,
                padding: "0.625rem 1.25rem",
                borderRadius: 12,
                color: "#fff",
                background: "linear-gradient(135deg,#E8571C,#C94811)",
                boxShadow: "0 2px 12px #E8571C30",
                textDecoration: "none",
              }}
            >
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      <section style={{ padding: "5rem 1.5rem 4rem", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "radial-gradient(ellipse 60% 50% at 50% 0%,#E8571C07 0%,transparent 70%)",
          }}
        />
        <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: 12,
              fontWeight: 700,
              padding: "0.375rem 0.875rem",
              borderRadius: 999,
              marginBottom: "2rem",
              background: "#FFF4EF",
              color: "#C94811",
              border: "1px solid #E8571C20",
            }}
          >
            Transparence totale
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif-display,Georgia,serif)",
              fontSize: "clamp(2.8rem,5.5vw,4.5rem)",
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
              marginBottom: "1.5rem",
            }}
          >
            Roadmap
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.65, color: "#57534E", maxWidth: 520, margin: "0 auto" }}>
            Ce qui est disponible aujourd'hui, ce qui est en cours et ce qui arrive bientôt sur Deazl. Mise à jour au fil des déploiements.
          </p>
        </div>
      </section>

      <section style={{ padding: "1rem 1.5rem 5rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div className="rm-section-grid">

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#ECFDF5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  ✅
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1C1917", lineHeight: 1 }}>Disponible aujourd'hui</h2>
                  <p style={{ fontSize: 12, color: "#059669", fontWeight: 600, marginTop: 2 }}>{available.length} fonctionnalités</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {available.map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      background: "#fff",
                      border: "1px solid #D1FAE5",
                      borderRadius: 14,
                      padding: "0.875rem 1rem",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <svg width="9" height="9" viewBox="0 0 10 8">
                        <polyline points="1 4 3.5 6.5 9 1" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#1C1917", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "#FFF4EF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    🔜
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1C1917", lineHeight: 1 }}>En développement</h2>
                    <p style={{ fontSize: 12, color: "#E8571C", fontWeight: 600, marginTop: 2 }}>Arrive bientôt</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {inProgress.map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        background: "#fff",
                        border: "1px solid #FED7AA",
                        borderRadius: 14,
                        padding: "0.875rem 1rem",
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#FFF4EF",
                          border: "2px solid #E8571C",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8571C" }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#1C1917", lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "#EDE9FE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    💡
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: "#1C1917", lineHeight: 1 }}>Sur la liste</h2>
                    <p style={{ fontSize: 12, color: "#7C3AED", fontWeight: 600, marginTop: 2 }}>Idées futures</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {planned.map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        background: "#fff",
                        border: "1px solid #DDD6FE",
                        borderRadius: 14,
                        padding: "0.875rem 1rem",
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#EDE9FE",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C3AED" }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#57534E", lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section style={{ padding: "5rem 1.5rem", background: "#1C1917", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "radial-gradient(ellipse 70% 60% at 50% 110%,#E8571C18 0%,transparent 70%)",
          }}
        />
        <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h2
            style={{
              fontFamily: "var(--font-serif-display,Georgia,serif)",
              fontSize: "clamp(2rem,4vw,3rem)",
              lineHeight: 1.1,
              color: "#FAF9F6",
              marginBottom: "1.25rem",
            }}
          >
            Envie d'essayer dès maintenant&nbsp;?
          </h2>
          <p style={{ fontSize: 16, color: "#A8A29E", marginBottom: "2.5rem" }}>
            Toutes les fonctionnalités disponibles sont accessibles gratuitement, sans carte bancaire.
          </p>
          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              fontWeight: 900,
              fontSize: 16,
              padding: "1rem 2rem",
              borderRadius: 16,
              color: "#fff",
              background: "linear-gradient(135deg,#E8571C,#C94811)",
              boxShadow: "0 8px 40px #E8571C40",
              textDecoration: "none",
            }}
          >
            Créer mon compte gratuitement
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <p style={{ marginTop: "1rem", fontSize: 13, color: "#57534E" }}>Gratuit · Sans engagement · Sans carte bancaire</p>
        </div>
      </section>

      <footer style={{ background: "#1C1917", borderTop: "1px solid #292524", padding: "2rem 1.5rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: "#E8571C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="2" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 900, color: "#FAF9F6" }}>deazl</span>
          </Link>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {[["/#features", "Fonctionnalités"], ["/roadmap", "Roadmap"], ["/register", "Créer un compte"], ["mailto:hello@deazl.fr", "Contact"]].map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: 13, color: "#57534E", textDecoration: "none" }}>
                {label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#44403C" }}>© 2026 Deazl</p>
        </div>
      </footer>
    </div>
  );
}
