"use client";

import { useState } from "react";

const PRIMARY = "#E8571C";
const PRIMARY_LIGHT = "#FFF4EF";
const FOREGROUND = "#1C1917";
const MUTED_FG = "#78716C";
const BORDER = "#E8E5E0";
const BG = "#FAF9F6";
const MUTED = "#F5F3EF";

const NAV_ITEMS = [
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
        <path d="M8 18h8" /><path d="M9 21h6" />
      </svg>
    ),
  },
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
    href: "/scan",
    label: "Scanner",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <line x1="7" y1="8" x2="7" y2="16" /><line x1="10.5" y1="8" x2="10.5" y2="16" />
        <line x1="14" y1="8" x2="14" y2="16" /><line x1="17" y1="8" x2="17" y2="16" />
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

function Row({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex items-center gap-4 px-4 py-3">{children}</div>
      <div style={{ marginLeft: 16, marginRight: 16, height: 1, background: BORDER }} />
    </>
  );
}

export default function DesignPage() {
  const [activeNav, setActiveNav] = useState(0);

  return (
    <div style={{ minHeight: "100vh", background: BG, paddingTop: 40, paddingBottom: 40, paddingLeft: 16, paddingRight: 16 }}>
      <div style={{ maxWidth: 390, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>

        {/* Header */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: PRIMARY, marginBottom: 6 }}>
            Design System
          </p>
          <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.02em", color: FOREGROUND }}>
            Deazl
          </h1>
          <p style={{ marginTop: 10, fontSize: 14, color: MUTED_FG }}>Palette · Typographie · Composants</p>
        </div>

        {/* ── Couleurs ── */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: MUTED_FG, marginBottom: 10 }}>Couleurs</p>
          <div style={{ overflow: "hidden", borderRadius: 20, background: "#fff", boxShadow: "0 1px 4px rgba(28,25,23,0.08)" }}>
            <Row>
              <div style={{ height: 40, width: 40, flexShrink: 0, borderRadius: 12, background: PRIMARY }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: FOREGROUND }}>Primary — Terracotta</p>
                <p style={{ fontSize: 12, color: MUTED_FG }}>#E8571C · Actions, CTA, navigation</p>
              </div>
            </Row>
            <Row>
              <div style={{ height: 40, width: 40, flexShrink: 0, borderRadius: 12, background: PRIMARY_LIGHT, border: `1px solid ${BORDER}` }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: FOREGROUND }}>Primary Light</p>
                <p style={{ fontSize: 12, color: MUTED_FG }}>#FFF4EF · Fonds, hover states</p>
              </div>
            </Row>
            <Row>
              <div style={{ height: 40, width: 40, flexShrink: 0, borderRadius: 12, background: "#DC2626" }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: FOREGROUND }}>Destructive</p>
                <p style={{ fontSize: 12, color: MUTED_FG }}>#DC2626 · Erreurs, suppressions</p>
              </div>
            </Row>
            <Row>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { bg: BG, border: BORDER },
                  { bg: "#fff", border: BORDER },
                  { bg: MUTED },
                  { bg: MUTED_FG },
                  { bg: FOREGROUND },
                ].map((c, i) => (
                  <div key={i} style={{ height: 40, width: 40, flexShrink: 0, borderRadius: 12, background: c.bg, border: c.border ? `1px solid ${c.border}` : undefined }} />
                ))}
              </div>
            </Row>
            <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 12 }}>
              <p style={{ fontSize: 12, color: MUTED_FG }}>background · card · muted · muted-fg · foreground</p>
            </div>
          </div>
        </section>

        {/* ── Typographie ── */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: MUTED_FG, marginBottom: 10 }}>Typographie — Geist Sans</p>
          <div style={{ borderRadius: 20, background: "#fff", boxShadow: "0 1px 4px rgba(28,25,23,0.08)", padding: "20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <p style={{ fontSize: 44, fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.02em", color: FOREGROUND }}>Grand titre</p>
              <p style={{ fontSize: 12, color: MUTED_FG, marginTop: 4 }}>44px · black · Page headers</p>
            </div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 900, color: FOREGROUND }}>Titre section</p>
              <p style={{ fontSize: 12, color: MUTED_FG }}>24px · black</p>
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, color: FOREGROUND }}>Sous-titre / Label fort</p>
              <p style={{ fontSize: 12, color: MUTED_FG }}>16px · semibold</p>
            </div>
            <div>
              <p style={{ fontSize: 14, color: "#44403C" }}>Corps de texte — descriptions, instructions, contenus longs.</p>
              <p style={{ fontSize: 12, color: MUTED_FG }}>14px · regular</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: PRIMARY }}>Eyebrow label</p>
              <p style={{ fontSize: 12, color: MUTED_FG }}>11px · bold · uppercase · tracking</p>
            </div>
          </div>
        </section>

        {/* ── Boutons ── */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: MUTED_FG, marginBottom: 10 }}>Boutons</p>
          <div style={{ borderRadius: 20, background: "#fff", boxShadow: "0 1px 4px rgba(28,25,23,0.08)", padding: "16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <button style={{ width: "100%", borderRadius: 16, background: PRIMARY, padding: "12px 16px", fontSize: 14, fontWeight: 700, color: "#fff", border: "none", cursor: "pointer" }}>
              Ajouter une recette
            </button>
            <button style={{ width: "100%", borderRadius: 16, background: "#fff", border: `1px solid ${BORDER}`, padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#44403C", cursor: "pointer" }}>
              Annuler
            </button>
            <button style={{ width: "100%", borderRadius: 16, background: "#FEF2F2", border: "1px solid rgba(220,38,38,0.12)", padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#DC2626", cursor: "pointer" }}>
              Supprimer
            </button>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 999, background: PRIMARY, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(232,87,28,0.3)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nouvelle recette
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ height: 56, width: 56, borderRadius: 999, background: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(232,87,28,0.35)", cursor: "pointer" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            </div>
            <p style={{ fontSize: 11, color: MUTED_FG, textAlign: "right" }}>FAB (floating action button)</p>
          </div>
        </section>

        {/* ── Card Recette ── */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: MUTED_FG, marginBottom: 10 }}>Card — Recette</p>
          <div style={{ borderRadius: 20, overflow: "hidden", background: "#fff", boxShadow: "0 1px 4px rgba(28,25,23,0.08)" }}>
            <div style={{ height: 140, background: "#FFF4EF", display: "flex", alignItems: "flex-end", padding: "0 14px 14px", position: "relative" }}>
              <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 72, fontWeight: 900, color: PRIMARY, opacity: 0.12, lineHeight: 1 }}>S</span>
              <p style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.2, color: "#9A3412", position: "relative" }}>Salade niçoise</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
              <span style={{ fontSize: 11, color: MUTED_FG }}>4 pers.</span>
              <span style={{ color: BORDER }}>·</span>
              <span style={{ fontSize: 11, color: MUTED_FG }}>20 mn</span>
              <span style={{ color: BORDER }}>·</span>
              <span style={{ fontSize: 11, color: MUTED_FG }}>6 ingr.</span>
            </div>
          </div>
        </section>

        {/* ── Planning slots ── */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: MUTED_FG, marginBottom: 10 }}>Planning — Meal slots</p>
          <div style={{ borderRadius: 24, overflow: "hidden", background: "#fff", boxShadow: "0 2px 16px rgba(28,25,23,0.10)" }}>
            {[
              { label: "Petit-déjeuner", icon: "☀️", color: "#F59E0B", bg: "#FFFBEB", filled: false },
              { label: "Déjeuner", icon: "🍴", color: PRIMARY, bg: PRIMARY_LIGHT, filled: true, recipe: "Salade niçoise" },
              { label: "Dîner", icon: "🌙", color: "#7C3AED", bg: "#F5F3FF", filled: false },
            ].map((slot, i) => (
              <div key={slot.label}>
                {i > 0 && <div style={{ margin: "0 16px", height: 1, background: "rgba(232,229,224,0.5)" }} />}
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 16px" }}>
                  <div style={{ height: 40, width: 40, flexShrink: 0, borderRadius: 12, background: slot.filled ? slot.bg : MUTED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    {slot.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: slot.filled ? slot.color : MUTED_FG + "88", marginBottom: 2 }}>{slot.label}</p>
                    {slot.filled
                      ? <p style={{ fontSize: 15, fontWeight: 600, color: FOREGROUND, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{slot.recipe}</p>
                      : <p style={{ fontSize: 14, color: MUTED_FG + "60" }}>Ajouter un repas</p>
                    }
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={slot.filled ? "#C8C4BE" : "#D6D3CE"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {slot.filled ? <polyline points="9 18 15 12 9 6" /> : <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>}
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Liste de courses ── */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: MUTED_FG, marginBottom: 10 }}>Liste de courses — Item</p>
          <div style={{ borderRadius: 20, overflow: "hidden", background: "#fff", boxShadow: "0 1px 4px rgba(28,25,23,0.08)" }}>
            {[
              { name: "Tomates cerises", sub: "500 g · Carrefour", price: "2,49 €", checked: false },
              { name: "Olives noires", sub: "100 g · Leclerc", price: "1,20 €", checked: true },
              { name: "Thon en boîte", sub: "200 g · Carrefour · alt. moins chère →", price: "3,80 €", checked: false },
            ].map((item, i) => (
              <div key={item.name}>
                {i > 0 && <div style={{ margin: "0 16px", height: 1, background: BORDER }} />}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", opacity: item.checked ? 0.45 : 1 }}>
                  <div style={{ height: 20, width: 20, flexShrink: 0, borderRadius: 6, border: `2px solid ${item.checked ? PRIMARY : BORDER}`, background: item.checked ? PRIMARY : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: FOREGROUND, textDecoration: item.checked ? "line-through" : undefined }}>{item.name}</p>
                    <p style={{ fontSize: 12, color: MUTED_FG }}>{item.sub}</p>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: item.checked ? MUTED_FG : PRIMARY }}>{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Nutri-Score ── */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: MUTED_FG, marginBottom: 10 }}>Badges — Nutri-Score</p>
          <div style={{ borderRadius: 20, background: "#fff", boxShadow: "0 1px 4px rgba(28,25,23,0.08)", padding: "16px 20px", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {[
              { grade: "A", color: "#038141", text: "#fff" },
              { grade: "B", color: "#85BB2F", text: "#fff" },
              { grade: "C", color: "#FECB02", text: FOREGROUND },
              { grade: "D", color: "#EE8100", text: "#fff" },
              { grade: "E", color: "#E63E11", text: "#fff" },
            ].map(({ grade, color, text }) => (
              <span key={grade} style={{ height: 32, width: 32, borderRadius: 8, background: color, color: text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                {grade}
              </span>
            ))}
            <span style={{ fontSize: 12, color: MUTED_FG, marginLeft: 4 }}>Nutri-Score officiel</span>
          </div>
        </section>

        {/* ── Tab Bar — Dynamic Label ── */}
        <section>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: MUTED_FG, marginBottom: 4 }}>Tab Bar — Dynamic Label</p>
          <p style={{ fontSize: 12, color: MUTED_FG, marginBottom: 12 }}>Icône active se dilate en pill avec label · cliquez pour tester</p>
          <div style={{ borderRadius: 20, overflow: "hidden", background: "#fff", boxShadow: "0 1px 4px rgba(28,25,23,0.08)" }}>
            <div style={{ height: 1, background: "rgba(232,229,224,0.7)" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", gap: 4, padding: "8px 8px 12px" }}>
              {NAV_ITEMS.map((item, i) => {
                const isActive = activeNav === i;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => setActiveNav(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: isActive ? 8 : 0,
                      borderRadius: 999,
                      padding: isActive ? "8px 14px" : "8px 8px",
                      background: isActive ? PRIMARY : "transparent",
                      color: isActive ? "#fff" : MUTED_FG + "99",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.34,1.2,0.64,1)",
                      boxShadow: isActive ? `0 4px 12px rgba(232,87,28,0.25)` : undefined,
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.icon}
                    {isActive && (
                      <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <p style={{ textAlign: "center", fontSize: 12, color: MUTED_FG + "80", paddingBottom: 24 }}>— Dev preview only —</p>
      </div>
    </div>
  );
}
