import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DM_Serif_Display } from "next/font/google";
import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { FaqAccordion } from "@/app/_components/faqAccordion";
import { FaApple, FaAndroid, FaGlobe } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Deazl — La liste de courses qui se fait toute seule",
  description: "Deazl génère votre liste de courses depuis vos recettes de la semaine, compare les prix entre vos magasins et suit votre stock en temps réel. Gratuit, sans carte bancaire.",
  keywords: ["liste de courses", "planification repas", "recettes", "gestion stock", "comparaison prix", "courses intelligentes"],
  metadataBase: new URL("https://deazl.fr"),
  openGraph: {
    title: "Deazl — La liste de courses qui se fait toute seule",
    description: "Planifiez vos repas, générez votre liste, comparez les prix. Gratuit.",
    url: "https://deazl.fr",
    siteName: "Deazl",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deazl — La liste de courses qui se fait toute seule",
    description: "Planifiez vos repas, générez votre liste, comparez les prix. Gratuit.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://deazl.fr" },
};

const serif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif-display",
  display: "swap",
});

export default async function LandingPage() {
  await initLinguiFromCookie();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.user_metadata?.onboarding_completed) redirect("/planning");

  const [{ count: recipeCount }, { count: profileCount }] = await Promise.all([
    supabase.from("recipes").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  function fmtCount(n: number | null): string {
    if (!n || n < 5) return "Nouveau";
    if (n < 50) return `${n}`;
    if (n < 100) return `${Math.floor(n / 10) * 10}+`;
    return `${Math.floor(n / 100) * 100}+`;
  }

  return (
    <div className={serif.variable} style={{ fontFamily: "var(--font-geist-sans, system-ui, sans-serif)", backgroundColor: "#FAF9F6", color: "#1C1917", overflowX: "hidden" }}>
      <style>{`
        .lp-nav-links { display: none; }
        @media (min-width: 768px) { .lp-nav-links { display: flex; } }
        .lp-hero { display: flex; flex-wrap: wrap; gap: 4rem; align-items: center; }
        .lp-hero-text { flex: 1 1 380px; }
        .lp-hero-phone { flex: 0 0 280px; max-width: 340px; width: 100%; }
        @media (min-width: 900px) { .lp-hero-phone { flex: 0 0 340px; } }
        .lp-phone-frame { display: none; }
        @media (min-width: 820px) { .lp-phone-frame { display: flex; } }
        .lp-cta-btns { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .lp-grid-3 { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        .lp-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 4rem; align-items: center; }
        .lp-grid-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 3rem; }
        .lp-grid-testimonials { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
        .lp-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 2rem; text-align: center; }
        .lp-footer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 2.5rem; }
        .lp-floating-cards { position: relative; width: 340px; height: 580px; }
        @keyframes lfloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes lpulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .lp-feature-card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.08); }
        .lp-feature-card { transition: transform 0.25s, box-shadow 0.25s; }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "#FAF9F6EE", backdropFilter: "blur(16px)", borderBottom: "1px solid #E8E5E0" }}>
        <div style={{ maxWidth: "1152px", margin: "0 auto", padding: "0 1.5rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#E8571C,#C94811)", boxShadow: "0 2px 8px #E8571C30", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.02em" }}>deazl</span>
          </div>

          <div className="lp-nav-links" style={{ alignItems: "center", gap: "2rem" }}>
            {[["#features", "Fonctionnalités"], ["#how", "Comment ça marche"], ["#faq", "FAQ"], ["/roadmap", "Roadmap"]].map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: 14, fontWeight: 500, color: "#78716C", textDecoration: "none" }}>{label}</a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Link href="/login" style={{ fontSize: 14, fontWeight: 600, padding: "0.5rem 1rem", borderRadius: 12, color: "#78716C", textDecoration: "none" }}>
              <Trans>Connexion</Trans>
            </Link>
            <Link href="/register" style={{ fontSize: 14, fontWeight: 700, padding: "0.625rem 1.25rem", borderRadius: 12, color: "#fff", background: "linear-gradient(135deg,#E8571C,#C94811)", boxShadow: "0 2px 12px #E8571C30", textDecoration: "none" }}>
              <Trans>Commencer</Trans>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ padding: "5rem 1.5rem 6rem", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 50% at 80% 30%,#E8571C0A 0%,transparent 70%)" }} />
        <div style={{ maxWidth: "1152px", margin: "0 auto" }}>
          <div className="lp-hero">
            <div className="lp-hero-text">
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: 12, fontWeight: 700, padding: "0.375rem 0.875rem", borderRadius: 999, marginBottom: "2rem", background: "#FFF4EF", color: "#C94811", border: "1px solid #E8571C20" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8571C", display: "inline-block", animation: "lpulse 2s ease-in-out infinite" }} />
                <Trans>Nouveau · Import de recettes depuis n'importe quelle URL</Trans>
              </div>

              <h1 style={{ fontFamily: "var(--font-serif-display,Georgia,serif)", fontSize: "clamp(2.8rem,5.5vw,5rem)", lineHeight: 1.04, letterSpacing: "-0.02em", marginBottom: "1.5rem" }}>
                <Trans>La liste de courses</Trans><br />
                <Trans>qui</Trans>{" "}<span style={{ color: "#E8571C" }}><Trans>se fait</Trans><br /><Trans>toute seule.</Trans></span>
              </h1>

              <p style={{ fontSize: 18, lineHeight: 1.65, color: "#57534E", maxWidth: 420, marginBottom: "2.5rem" }}>
                <Trans>Deazl génère votre liste de courses depuis vos recettes de la semaine, compare les prix entre vos magasins et suit votre stock en temps réel.</Trans>
              </p>

              <div className="lp-cta-btns">
                <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#fff", fontWeight: 700, fontSize: 16, padding: "1rem 1.75rem", borderRadius: 16, background: "linear-gradient(135deg,#E8571C,#C94811)", boxShadow: "0 4px 24px #E8571C30", textDecoration: "none" }}>
                  <Trans>Commencer gratuitement</Trans>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
                <a href="#how" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#1C1917", fontWeight: 600, fontSize: 16, padding: "1rem 1.75rem", borderRadius: 16, background: "#fff", border: "1px solid #E8E5E0", textDecoration: "none" }}>
                  <Trans>Voir comment ça marche</Trans>
                </a>
              </div>

              <p style={{ marginTop: "1rem", fontSize: 12, fontWeight: 500, color: "#A8A29E" }}>
                <Trans>Gratuit · Sans carte bancaire · Données hébergées en Europe</Trans>
              </p>

              <div style={{ marginTop: "2.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ display: "flex" }}>
                  {[["M","#E8571C"],["A","#0284C7"],["C","#C026D3"],["T","#78716C"]].map(([l,bg],i) => (
                    <div key={l} style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #FAF9F6", marginLeft: i > 0 ? -10 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff", background: bg }}>
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                    {Array(5).fill(0).map((_,i) => <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#FBBF24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>)}
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#78716C" }}>{profileCount && profileCount >= 5 ? `Rejoignez ${fmtCount(profileCount)} familles` : "Soyez parmi les premiers"}</p>
                </div>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="lp-phone-frame" style={{ justifyContent: "center", position: "relative", height: 580, flex: "0 0 320px" }}>
              <div style={{ position: "absolute", left: -28, top: 70, width: 160, background: "#fff", border: "1px solid #E8E5E0", borderRadius: 16, padding: "0.875rem", boxShadow: "0 8px 32px rgba(0,0,0,0.10)", animation: "lfloat 6s ease-in-out infinite", zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "#FFF4EF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#E8571C" }}>Meilleur prix</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1C1917" }}>Lidl</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: "#E8571C" }}>12.40 €</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", opacity: 0.4 }}>
                  <span style={{ fontSize: 10, color: "#78716C" }}>Carrefour</span>
                  <span style={{ fontSize: 10, color: "#78716C", textDecoration: "line-through" }}>14.80 €</span>
                </div>
              </div>

              <div style={{ position: "absolute", right: -20, top: 20, width: 148, background: "linear-gradient(135deg,#E8571C,#C94811)", borderRadius: 16, padding: "0.875rem", boxShadow: "0 8px 32px #E8571C40", animation: "lfloat 8s ease-in-out infinite reverse", zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)" }}>Importée</span>
                </div>
                <p style={{ fontSize: 12, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>Poulet rôti au citron</p>
                <p style={{ fontSize: 9, marginTop: 2, color: "rgba(255,255,255,0.5)" }}>depuis marmiton.org</p>
              </div>

              <div style={{ position: "absolute", left: -20, bottom: 100, width: 150, background: "#fff", border: "1px solid #E8E5E0", borderRadius: 16, padding: "0.75rem", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", animation: "lfloat 7s ease-in-out infinite 1.5s", zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#DC2626" }}>Expire bientôt</span>
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#1C1917" }}>Lait demi-écrémé</p>
                <p style={{ fontSize: 9, color: "#A8A29E" }}>Dans 2 jours</p>
              </div>

              <div style={{ width: 268, height: 546, background: "#1C1917", borderRadius: 44, border: "4px solid #292524", boxShadow: "0 40px 80px rgba(0,0,0,0.40)", overflow: "hidden", position: "relative", zIndex: 5 }}>
                <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 96, height: 20, background: "#0C0A09", borderRadius: 12, zIndex: 20 }} />
                <div style={{ position: "absolute", inset: 3, borderRadius: 40, background: "#FAF9F6", overflow: "hidden" }}>
                  <div style={{ padding: "2.5rem 1rem 0.75rem", background: "linear-gradient(135deg,#FFF4EF,#FFE4D6)" }}>
                    <p style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#E8571C" }}>Semaine du 10 mars</p>
                    <p style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, marginTop: 2, color: "#1C1917" }}>Planning</p>
                  </div>
                  <div style={{ padding: "0.5rem 0.75rem", display: "flex", flexDirection: "column", gap: 6 }}>
                    {[["Lun","Pâtes carbonara","#FFF4EF","#E8571C","25min"],["Mar","Poulet rôti 🍋","#F0FDF4","#16A34A","1h20"],["Mer","Salade niçoise","#EFF6FF","#2563EB","15min"],["Jeu","Ratatouille","#FDF2F8","#C026D3","50min"]].map(([day,meal,bg,accent,time]) => (
                      <div key={day} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.5rem 0.625rem", borderRadius: 12, background: bg }}>
                        <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", width: 20, textAlign: "center", flexShrink: 0, color: accent }}>{day}</span>
                        <span style={{ flex: 1, fontSize: 10, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1C1917" }}>{meal}</span>
                        <span style={{ fontSize: 8, fontWeight: 500, flexShrink: 0, color: accent + "90" }}>{time}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ margin: "0.25rem 0.75rem", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 12, padding: "0.625rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <p style={{ fontSize: 9, fontWeight: 900, color: "#1C1917" }}>Liste · 14 articles</p>
                      <span style={{ fontSize: 8, fontWeight: 700, color: "#E8571C" }}>Voir →</span>
                    </div>
                    {["Lardons fumés 200g","Parmesan 100g","Courgettes ×2"].map((item) => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, border: "1px solid #E8571C40", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="6" height="5" viewBox="0 0 10 8"><polyline points="1 4 3.5 6.5 9 1" stroke="#E8571C" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                        <span style={{ fontSize: 9, color: "#78716C" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 6px 6px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: 2, borderRadius: 20, background: "#fff", padding: "5px 3px", boxShadow: "0 -2px 16px rgba(0,0,0,0.07)", border: "0.5px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#E8571C", borderRadius: 999, padding: "5px 9px", boxShadow: "0 2px 6px #E8571C40" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>Planning</span>
                      </div>
                      <div style={{ padding: "5px 6px", opacity: 0.35 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 0 1 7-7z"/><path d="M8 18h8"/><path d="M9 21h6"/></svg>
                      </div>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1C1917", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="8" x2="7" y2="16"/><line x1="10.5" y1="8" x2="10.5" y2="16"/><line x1="14" y1="8" x2="14" y2="16"/><line x1="17" y1="8" x2="17" y2="16"/></svg>
                      </div>
                      <div style={{ padding: "5px 6px", opacity: 0.35 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                      </div>
                      <div style={{ padding: "5px 6px", opacity: 0.35 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <div style={{ background: "#fff", borderTop: "1px solid #E8E5E0", borderBottom: "1px solid #E8E5E0" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 1.5rem" }}>
          <div className="lp-stats">
            {[[fmtCount(recipeCount),"Recettes créées"],[fmtCount(profileCount),"Familles inscrites"],["30 min+","Économisées par semaine"]].map(([n,label]) => (
              <div key={label}>
                <p style={{ fontFamily: "var(--font-serif-display,Georgia,serif)", fontSize: 36, fontWeight: 900, color: "#E8571C", marginBottom: 4 }}>{n}</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#78716C" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── PLATFORM ─── */}
      <section style={{ padding: "3.5rem 1.5rem", background: "#fff", borderBottom: "1px solid #E8E5E0" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#E8571C", marginBottom: "0.75rem" }}>Disponible partout</p>
          <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 900, marginBottom: "2.5rem" }}>Web, iOS et Android — toujours avec vous</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
            {([
              {
                icon: <FaGlobe size={24} />,
                color: "#0284C7", bg: "#EFF6FF",
                title: "Application web", desc: "Accessible depuis n'importe quel navigateur, sans installation. Toujours synchronisé avec vos appareils.", badge: "deazl.fr",
              },
              {
                icon: <FaApple size={26} />,
                color: "#1C1917", bg: "#F5F3EF",
                title: "iPhone / iPad", desc: "L'app native iOS arrive bientôt sur l'App Store. En attendant, accédez à Deazl via votre navigateur.", badge: "App Store — bientôt",
              },
              {
                icon: <FaAndroid size={26} />,
                color: "#3DDC84", bg: "#F0FDF4",
                title: "Android", desc: "Application native disponible dès maintenant. Téléchargez l'APK ou attendez la publication sur le Play Store.", badge: "App native Android",
              },
            ] as { icon: React.ReactNode; color: string; bg: string; title: string; desc: string; badge: string }[]).map((p) => (
              <div key={p.title} style={{ background: "#FAF9F6", border: "1px solid #E8E5E0", borderRadius: 20, padding: "1.75rem", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: p.bg, color: p.color, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>{p.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1C1917", marginBottom: "0.5rem" }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: "#78716C", lineHeight: 1.6, marginBottom: "0.875rem" }}>{p.desc}</p>
                <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: "#FFF4EF", color: "#E8571C" }}>{p.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "1152px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#E8571C", marginBottom: "0.75rem" }}><Trans>Fonctionnalités</Trans></p>
            <h2 style={{ fontFamily: "var(--font-serif-display,Georgia,serif)", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.15 }}>
              <Trans>Tout ce dont vous avez besoin,</Trans><br /><Trans>rien de superflu.</Trans>
            </h2>
          </div>
          <div className="lp-grid-3">
            {([
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, color:"#E8571C", bg:"#FFF4EF", title:"Planning hebdomadaire", desc:"Organisez vos repas sur la semaine en quelques secondes. Visualisez votre menu d'un coup d'œil et naviguez d'une semaine à l'autre." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, color:"#0284C7", bg:"#EFF6FF", title:"Gestion des recettes", desc:"Créez vos recettes ou importez-les depuis n'importe quelle URL. Marmiton, 750g, blogs culinaires — Deazl extrait automatiquement tout." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>, color:"#7C3AED", bg:"#EDE9FE", title:"Liste auto-générée", desc:"Votre liste de courses est créée automatiquement depuis votre planning. Quantités calculées, doublons fusionnés, articles catégorisés." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, color:"#C94811", bg:"#FFF4EF", title:"Comparaison de prix", desc:"Comparez le coût total de votre semaine entre vos magasins. Deazl vous dit où acheter au meilleur prix, article par article." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><line x1="12" y1="22" x2="12" y2="12"/></svg>, color:"#D97706", bg:"#FEF3C7", title:"Gestion du stock", desc:"Scannez les codes-barres, suivez les dates d'expiration et recevez des alertes avant que ça tourne. Fini le gaspillage alimentaire." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, color:"#C026D3", bg:"#FDF2F8", title:"Partage en famille", desc:"Invitez votre foyer et synchronisez la liste en temps réel. Quand quelqu'un coche un article, tout le monde le voit instantanément." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>, color:"#059669", bg:"#ECFDF5", title:"Mode courses en temps réel", desc:"Scannez ou cherchez vos articles en magasin, saisissez le prix au rayon, visualisez le total à la caisse. Fini les mauvaises surprises." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>, color:"#7C3AED", bg:"#EDE9FE", title:"Split de courses", desc:"Répartissez automatiquement les articles entre les membres du foyer selon les budgets. Gestion des tickets restaurant incluse." },
            ] as { icon: React.ReactNode; color: string; bg: string; title: string; desc: string }[]).map((f) => (
              <div key={f.title} className="lp-feature-card" style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 24, padding: "1.75rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: f.bg, color: f.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>{f.icon}</div>
                <h3 style={{ fontWeight: 900, fontSize: 16, color: "#1C1917", marginBottom: "0.625rem" }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#78716C" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON ─── */}
      <section style={{ padding: "5rem 1.5rem", background: "#fff", borderTop: "1px solid #E8E5E0", borderBottom: "1px solid #E8E5E0" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#E8571C", marginBottom: "0.75rem" }}>Pourquoi Deazl ?</p>
            <h2 style={{ fontFamily: "var(--font-serif-display,Georgia,serif)", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.15 }}>
              Pas juste une liste.<br /><span style={{ color: "#E8571C" }}>Un assistant complet.</span>
            </h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.875rem 1rem", color: "#A8A29E", fontWeight: 600, fontSize: 12, borderBottom: "2px solid #E8E5E0", minWidth: 180 }}>Fonctionnalité</th>
                  {[["deazl","#FFF4EF","#E8571C"],["Liste papier","#F5F3EF","#78716C"],["Notes iPhone","#F5F3EF","#78716C"]].map(([name,bg,color]) => (
                    <th key={name} style={{ textAlign: "center", padding: "0.875rem 1rem", borderBottom: "2px solid #E8E5E0", minWidth: 110 }}>
                      <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, background: bg, color, fontSize: 13, fontWeight: 800 }}>{name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Génération automatique de la liste", true, false, false],
                  ["Import de recettes depuis une URL", true, false, false],
                  ["Comparaison de prix par magasin", true, false, false],
                  ["Alertes d'expiration du stock", true, false, false],
                  ["Partage en temps réel (famille)", true, false, "partial"],
                  ["Scan de codes-barres", true, false, false],
                  ["Planification hebdomadaire", true, false, "partial"],
                  ["100% gratuit", true, true, true],
                ].map(([feat, deazl, paper, notes], i) => (
                  <tr key={String(feat)} style={{ background: i % 2 === 0 ? "#FAF9F6" : "#fff" }}>
                    <td style={{ padding: "0.875rem 1rem", color: "#1C1917", fontWeight: 500 }}>{feat as string}</td>
                    {[deazl, paper, notes].map((val, j) => (
                      <td key={j} style={{ textAlign: "center", padding: "0.875rem 1rem" }}>
                        {val === true ? (
                          <span style={{ display: "inline-flex", width: 24, height: 24, borderRadius: "50%", background: "#E8571C", alignItems: "center", justifyContent: "center" }}>
                            <svg width="10" height="10" viewBox="0 0 10 8"><polyline points="1 4 3.5 6.5 9 1" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
                          </span>
                        ) : val === "partial" ? (
                          <span style={{ display: "inline-flex", width: 24, height: 24, borderRadius: "50%", background: "#F5F3EF", alignItems: "center", justifyContent: "center", fontSize: 12 }}>~</span>
                        ) : (
                          <span style={{ display: "inline-flex", width: 24, height: 24, borderRadius: "50%", background: "#F5F3EF", alignItems: "center", justifyContent: "center" }}>
                            <svg width="8" height="8" viewBox="0 0 8 8"><line x1="1" y1="1" x2="7" y2="7" stroke="#A8A29E" strokeWidth="1.5" strokeLinecap="round"/><line x1="7" y1="1" x2="1" y2="7" stroke="#A8A29E" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" style={{ padding: "5rem 1.5rem", background: "#fff", borderTop: "1px solid #E8E5E0", borderBottom: "1px solid #E8E5E0" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#E8571C", marginBottom: "0.75rem" }}><Trans>Comment ça marche</Trans></p>
            <h2 style={{ fontFamily: "var(--font-serif-display,Georgia,serif)", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.15 }}>
              <Trans>Trois étapes.</Trans> <span style={{ color: "#E8571C" }}><Trans>C'est tout.</Trans></span>
            </h2>
          </div>
          <div className="lp-grid-steps">
            {([
              { n:"01", title:"Planifiez votre semaine", desc:"Parcourez vos recettes et assignez-les à chaque repas. Deazl suggère des recettes adaptées à vos préférences.", icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
              { n:"02", title:"Deazl génère votre liste", desc:"En un clic, tous les ingrédients de la semaine sont regroupés avec les bonnes quantités pour votre foyer.", icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
              { n:"03", title:"Faites vos courses malin", desc:"Emportez votre liste sur téléphone. Cochez les articles au fur et à mesure. Deazl vous indique le magasin le moins cher.", icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
            ] as { n:string; title:string; desc:string; icon:React.ReactNode }[]).map((step) => (
              <div key={step.n} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#E8571C,#C94811)", boxShadow: "0 8px 24px #E8571C30", marginBottom: "1.25rem" }}>
                  {step.icon}
                </div>
                <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#E8571C", marginBottom: "0.75rem" }}>{step.n}</p>
                <h3 style={{ fontWeight: 900, fontSize: 18, color: "#1C1917", marginBottom: "0.75rem" }}>{step.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#78716C", maxWidth: 260 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURE SPOTLIGHT: IMPORT ─── */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div className="lp-grid-2">
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999, padding: "0.375rem 0.75rem", marginBottom: "1.5rem", background: "#EFF6FF", color: "#0284C7", fontSize: 12, fontWeight: 700 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <Trans>Import depuis l'URL</Trans>
              </div>
              <h2 style={{ fontFamily: "var(--font-serif-display,Georgia,serif)", fontSize: "clamp(1.75rem,3.5vw,2.5rem)", lineHeight: 1.2, marginBottom: "1.25rem" }}>
                <Trans>Vos recettes favorites,</Trans><br /><Trans>en un clic.</Trans>
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: "#78716C", marginBottom: "1.5rem" }}>
                <Trans>Trouvez une recette sur Marmiton, 750g ou n'importe quel blog. Copiez l'URL. Deazl importe automatiquement les ingrédients, les quantités, les étapes et la photo.</Trans>
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {["Compatible avec tous les sites de recettes","Import des ingrédients et quantités exactes","Fallback intelligent si le site est protégé","Recettes sauvegardées définitivement"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", fontSize: 14, fontWeight: 500, color: "#1C1917", listStyle: "none" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#FFF4EF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <svg width="9" height="9" viewBox="0 0 10 8"><polyline points="1 4 3.5 6.5 9 1" stroke="#E8571C" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 24, padding: "1.5rem", boxShadow: "0 20px 60px rgba(0,0,0,0.07)" }}>
              <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A8A29E", marginBottom: "1rem" }}><Trans>Coller une URL de recette</Trans></p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#FAF9F6", border: "1px solid #E8E5E0", borderRadius: 16, padding: "0.875rem 1rem", marginBottom: "1rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span style={{ fontSize: 14, color: "#A8A29E", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>https://www.marmiton.org/recettes/poulet-roti…</span>
                <div style={{ padding: "0.375rem 0.75rem", borderRadius: 10, background: "#E8571C", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}><Trans>Importer</Trans></div>
              </div>
              <div style={{ background: "#FFF4EF", border: "1px solid #E8571C20", borderRadius: 16, padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: "#FFE4D6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>🍋</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 900, color: "#1C1917" }}>Poulet rôti au citron</p>
                    <p style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}>4 personnes · 1h20 · 6 ingrédients</p>
                    <div style={{ display: "inline-flex", marginTop: 4, padding: "2px 6px", borderRadius: 4, background: "#FFF4EF", color: "#E8571C", fontSize: 9, fontWeight: 900 }}>Importé ✓</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {["Poulet entier","Citron × 2","Thym","Beurre 50g","Ail × 4","Herbes de Provence"].map((i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, borderRadius: 8, padding: "0.375rem 0.5rem", background: "#fff", color: "#1C1917" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8571C", flexShrink: 0 }} />{i}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ padding: "5rem 1.5rem", background: "#fff", borderTop: "1px solid #E8E5E0", borderBottom: "1px solid #E8E5E0" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#E8571C", marginBottom: "0.75rem" }}><Trans>Témoignages</Trans></p>
            <h2 style={{ fontFamily: "var(--font-serif-display,Georgia,serif)", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.15 }}>
              <Trans>Ils ont simplifié</Trans><br /><span style={{ color: "#E8571C" }}><Trans>leurs courses.</Trans></span>
            </h2>
          </div>
          <div className="lp-grid-testimonials">
            {([
              { quote:"Depuis que j'utilise Deazl, j'ai arrêté de jeter de la nourriture. Les alertes d'expiration m'ont sauvé la mise des dizaines de fois.", author:"Marie L.", role:"Mère de 2 enfants, Lyon", initial:"M", color:"#E8571C" },
              { quote:"La comparaison de prix m'a fait économiser environ 80€ par mois. Et générer la liste depuis le planning, c'est magique.", author:"Thomas B.", role:"Étudiant, Paris", initial:"T", color:"#0284C7" },
              { quote:"J'importe toutes mes recettes Marmiton en un clic. Ma femme et moi partageons la liste et on se répartit les rayons.", author:"Sébastien R.", role:"Chef amateur, Bordeaux", initial:"S", color:"#C026D3" },
            ] as { quote:string; author:string; role:string; initial:string; color:string }[]).map((t) => (
              <div key={t.author} style={{ background: "#FAF9F6", border: "1px solid #E8E5E0", borderRadius: 24, padding: "2rem" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: "1.25rem" }}>
                  {Array(5).fill(0).map((_,i) => <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.65, fontWeight: 500, color: "#1C1917", marginBottom: "1.5rem" }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{t.initial}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 900, color: "#1C1917" }}>{t.author}</p>
                    <p style={{ fontSize: 12, color: "#A8A29E" }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT'S NEW ─── */}
      <div style={{ background: "#fff", borderTop: "1px solid #E8E5E0", borderBottom: "1px solid #E8E5E0", padding: "1.25rem 1.5rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.15em", color: "#E8571C", flexShrink: 0 }}>Récemment ajouté</span>
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
            {[
              ["🛒 Mode courses en temps réel","mars 2026"],
              ["💳 Split & ticket restaurant","mars 2026"],
              ["✨ Favoris & filtres intelligents","mars 2026"],
              ["🔗 Partage public de recettes","mars 2026"],
            ].map(([feat, date]) => (
              <div key={String(feat)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#FAF9F6", border: "1px solid #E8E5E0", borderRadius: 999, padding: "5px 12px" }}>
                <span style={{ fontSize: 13, color: "#1C1917", fontWeight: 500 }}>{feat as string}</span>
                <span style={{ fontSize: 11, color: "#A8A29E" }}>{date as string}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── PRICING ─── */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#E8571C", marginBottom: "0.75rem" }}>Tarifs</p>
            <h2 style={{ fontFamily: "var(--font-serif-display,Georgia,serif)", fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.15 }}>
              Gratuit.<br /><span style={{ color: "#E8571C" }}>Pour toujours.</span>
            </h2>
            <p style={{ fontSize: 16, color: "#78716C", marginTop: "1rem" }}>Pas de freemium, pas de limite cachée, pas d'abonnement. Jamais.</p>
          </div>
          <div style={{ maxWidth: 480, margin: "0 auto", background: "#fff", border: "2px solid #E8571C20", borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
            <div style={{ background: "linear-gradient(135deg,#E8571C,#C94811)", padding: "2rem", textAlign: "center" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.5rem" }}>Plan unique</p>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: "0.25rem" }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: "#fff", lineHeight: 1 }}>0</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,0.8)", marginTop: 8 }}>€</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: "0.5rem" }}>par mois, pour toujours</p>
            </div>
            <div style={{ padding: "2rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "2rem" }}>
                {[
                  "Planning de repas hebdomadaire",
                  "Recettes illimitées + import URL",
                  "Liste de courses auto-générée",
                  "Comparaison de prix par magasin",
                  "Gestion du stock & alertes expiration",
                  "Scan de codes-barres",
                  "Partage avec la famille en temps réel",
                  "App native Android · Web · iOS bientôt",
                ].map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#FFF4EF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="9" height="9" viewBox="0 0 10 8"><polyline points="1 4 3.5 6.5 9 1" stroke="#E8571C" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                    </div>
                    <span style={{ fontSize: 14, color: "#1C1917", fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/register" style={{ display: "block", textAlign: "center", padding: "0.875rem", borderRadius: 14, background: "linear-gradient(135deg,#E8571C,#C94811)", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                Créer mon compte gratuit
              </Link>
              <p style={{ fontSize: 12, color: "#A8A29E", textAlign: "center", marginTop: "0.75rem" }}>Aucune carte bancaire · Aucun engagement</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#E8571C", marginBottom: "0.75rem" }}>FAQ</p>
            <h2 style={{ fontFamily: "var(--font-serif-display,Georgia,serif)", fontSize: "clamp(2rem,4vw,3rem)" }}><Trans>Questions fréquentes</Trans></h2>
          </div>
          <FaqAccordion />
          <div style={{ marginTop: "2.5rem", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#78716C" }}>
              <Trans>Une autre question ?</Trans>{" "}
              <a href="mailto:hello@deazl.fr" style={{ fontWeight: 600, color: "#E8571C", textDecoration: "none" }}>hello@deazl.fr</a>
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: "5rem 1.5rem", background: "#1C1917", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 60% at 50% 110%,#E8571C18 0%,transparent 70%)" }} />
        <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", position: "relative" }}>
          <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.2em", color: "#E8571C", marginBottom: "1.25rem" }}><Trans>Prêt à commencer ?</Trans></p>
          <h2 style={{ fontFamily: "var(--font-serif-display,Georgia,serif)", fontSize: "clamp(2.5rem,5vw,4rem)", lineHeight: 1.05, color: "#FAF9F6", marginBottom: "1.5rem" }}>
            <Trans>Simplifiez vos courses</Trans><br /><span style={{ color: "#E8571C" }}><Trans>dès aujourd'hui.</Trans></span>
          </h2>
          <p style={{ fontSize: 17, color: "#A8A29E", marginBottom: "2.5rem" }}>
            <Trans>Rejoignez des milliers de familles qui planifient mieux et dépensent moins.</Trans>
          </p>
          <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", fontWeight: 900, fontSize: 17, padding: "1.125rem 2.5rem", borderRadius: 16, color: "#fff", background: "linear-gradient(135deg,#E8571C,#C94811)", boxShadow: "0 8px 40px #E8571C40", textDecoration: "none" }}>
            <Trans>Créer mon compte gratuitement</Trans>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
          <p style={{ marginTop: "1rem", fontSize: 13, color: "#57534E" }}><Trans>Gratuit · Sans engagement · Sans carte bancaire</Trans></p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: "#1C1917", borderTop: "1px solid #292524", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div className="lp-footer-grid" style={{ marginBottom: "3rem" }}>
            <div style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#E8571C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
                </div>
                <span style={{ fontSize: 17, fontWeight: 900, color: "#FAF9F6" }}>deazl</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "#57534E", maxWidth: 280 }}>
                <Trans>L'application de planification de repas et gestion de courses intelligente pour les familles.</Trans>
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "#44403C", marginBottom: "1rem" }}><Trans>Produit</Trans></p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.625rem", listStyle: "none", padding: 0 }}>
                {[["#features","Fonctionnalités"],["#how","Comment ça marche"],["#faq","FAQ"],["/roadmap","Roadmap"],["/register","Créer un compte"]].map(([href,label]) => (
                  <li key={href}><a href={href} style={{ fontSize: 14, color: "#57534E", textDecoration: "none" }}>{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "#44403C", marginBottom: "1rem" }}><Trans>Légal</Trans></p>
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.625rem", listStyle: "none", padding: 0 }}>
                {[["/confidentialite","Confidentialité"],["/conditions","Conditions d'utilisation"],["/mentions-legales","Mentions légales"],["/rgpd","RGPD"],["/securite","Sécurité"]].map(([href,label]) => (
                  <li key={label}><a href={href} style={{ fontSize: 14, color: "#57534E", textDecoration: "none" }}>{label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #292524", paddingTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between" }}>
            <p style={{ fontSize: 12, color: "#44403C" }}>© 2026 Clément Muth — Deazl. <Trans>Tous droits réservés.</Trans></p>
            <p style={{ fontSize: 12, color: "#44403C" }}><Trans>Projet personnel · Données hébergées en Europe (Irlande)</Trans></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
