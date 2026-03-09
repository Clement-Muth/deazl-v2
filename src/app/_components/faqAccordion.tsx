"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Deazl est-il gratuit ?",
    a: "Oui, Deazl est entièrement gratuit. Créez votre compte et commencez immédiatement — aucune carte bancaire requise, aucune limite cachée.",
  },
  {
    q: "Fonctionne-t-il sur mobile ?",
    a: "Oui. Deazl est une application progressive (PWA) installable sur iOS et Android. Le scan de codes-barres, les notifications d'expiration et la liste partagée en temps réel fonctionnent nativement sur mobile.",
  },
  {
    q: "Peut-on importer des recettes depuis internet ?",
    a: "Absolument. Collez l'URL de n'importe quelle recette — Marmiton, 750g, Cuisine Actuelle ou n'importe quel blog culinaire — et Deazl importe automatiquement les ingrédients, les étapes et la photo.",
  },
  {
    q: "Comment fonctionne la comparaison de prix ?",
    a: "Renseignez vos magasins habituels dans votre profil. Deazl calcule ensuite le coût total de chaque recette par magasin selon les prix que vous avez reportés, et vous indique où acheter au meilleur prix chaque semaine.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Vos données sont chiffrées en transit (TLS) et au repos. Nos serveurs sont hébergés en Europe (Irlande) via Supabase, conformément au RGPD. Vos recettes et listes ne sont jamais partagées sans votre consentement explicite.",
  },
  {
    q: "Peut-on partager la liste avec son conjoint ou sa famille ?",
    a: "Oui. Invitez les membres de votre foyer depuis votre profil. La liste de courses est synchronisée en temps réel : quand quelqu'un coche un article au magasin, tout le monde le voit immédiatement.",
  },
];

const CSS = `
  .faq-item { border-radius: 16px; overflow: hidden; border: 1px solid #E8E5E0; background: #fff; }
  .faq-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; text-align: left; gap: 1rem; background: transparent; border: 0; cursor: pointer; }
  .faq-q { font-weight: 600; color: #1C1917; font-size: 15px; line-height: 1.4; }
  .faq-icon { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #F5F3EF; transition: background 0.2s, transform 0.2s; }
  .faq-icon svg { stroke: #78716C; }
  .faq-icon.open { background: #E8571C; transform: rotate(45deg); }
  .faq-icon.open svg { stroke: white; }
  .faq-body { max-height: 0; overflow: hidden; transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1); }
  .faq-body.open { max-height: 300px; }
  .faq-answer { padding: 0 1.5rem 1.25rem; padding-top: 1rem; font-size: 14px; color: #78716C; line-height: 1.65; border-top: 1px solid rgba(0,0,0,0.05); }
`;

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {FAQS.map((faq, i) => (
          <div key={i} className="faq-item">
            <button
              type="button"
              className="faq-btn"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="faq-q">{faq.q}</span>
              <span className={`faq-icon${open === i ? " open" : ""}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
            </button>
            <div className={`faq-body${open === i ? " open" : ""}`}>
              <p className="faq-answer">{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
