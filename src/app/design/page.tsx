export default function DesignPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] py-10 px-4">
      <div className="mx-auto max-w-sm space-y-10">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Design System</p>
          <h1 className="mt-1 text-3xl font-bold text-[#111827]">Deazl</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Palette · Typographie · Composants</p>
        </div>

        {/* ── Couleurs ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Couleurs</h2>
          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">

            {/* Primary */}
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-[#16A34A]" />
              <div>
                <p className="text-sm font-semibold text-[#111827]">Primary</p>
                <p className="text-xs text-[#6B7280]">#16A34A · green-600</p>
                <p className="text-xs text-[#6B7280]">Actions, CTA, navigation</p>
              </div>
            </div>
            <div className="mx-4 border-t border-[#E5E7EB]" />

            {/* Primary light */}
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="h-10 w-10 flex-shrink-0 rounded-xl border border-[#E5E7EB] bg-[#F0FDF4]" />
              <div>
                <p className="text-sm font-semibold text-[#111827]">Primary Light</p>
                <p className="text-xs text-[#6B7280]">#F0FDF4 · green-50</p>
                <p className="text-xs text-[#6B7280]">Backgrounds légers, hover states</p>
              </div>
            </div>
            <div className="mx-4 border-t border-[#E5E7EB]" />

            {/* Accent */}
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-[#F59E0B]" />
              <div>
                <p className="text-sm font-semibold text-[#111827]">Accent</p>
                <p className="text-xs text-[#6B7280]">#F59E0B · amber-500</p>
                <p className="text-xs text-[#6B7280]">Prix, économies, badges</p>
              </div>
            </div>
            <div className="mx-4 border-t border-[#E5E7EB]" />

            {/* Accent light */}
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="h-10 w-10 flex-shrink-0 rounded-xl border border-[#E5E7EB] bg-[#FFFBEB]" />
              <div>
                <p className="text-sm font-semibold text-[#111827]">Accent Light</p>
                <p className="text-xs text-[#6B7280]">#FFFBEB · amber-50</p>
                <p className="text-xs text-[#6B7280]">Fond badges prix</p>
              </div>
            </div>
            <div className="mx-4 border-t border-[#E5E7EB]" />

            {/* Danger */}
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-[#EF4444]" />
              <div>
                <p className="text-sm font-semibold text-[#111827]">Danger</p>
                <p className="text-xs text-[#6B7280]">#EF4444 · red-500</p>
                <p className="text-xs text-[#6B7280]">Erreurs, péremptions proches</p>
              </div>
            </div>
            <div className="mx-4 border-t border-[#E5E7EB]" />

            {/* Neutrals */}
            <div className="flex items-center gap-4 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-10 w-10 flex-shrink-0 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]" />
                <div className="h-10 w-10 flex-shrink-0 rounded-xl border border-[#E5E7EB] bg-white" />
                <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-[#6B7280]" />
                <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-[#111827]" />
              </div>
            </div>
            <div className="px-4 pb-3 -mt-1">
              <p className="text-xs text-[#6B7280]">gray-50 (fond) · white (surface) · gray-500 (texte sec.) · gray-900 (texte)</p>
            </div>
          </div>
        </section>

        {/* ── Typographie ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Typographie — Geist Sans</h2>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 space-y-4">
            <div>
              <p className="text-2xl font-bold text-[#111827]">Titre principal</p>
              <p className="text-xs text-[#6B7280]">24px · bold · gray-900</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-[#111827]">Titre section</p>
              <p className="text-xs text-[#6B7280]">20px · semibold · gray-900</p>
            </div>
            <div>
              <p className="text-base font-medium text-[#111827]">Sous-titre / Label fort</p>
              <p className="text-xs text-[#6B7280]">16px · medium · gray-900</p>
            </div>
            <div>
              <p className="text-sm text-[#374151]">Corps de texte — descriptions, instructions, contenus longs. Taille principale pour la majorité du contenu.</p>
              <p className="text-xs text-[#6B7280]">14px · regular · gray-700</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Texte secondaire, métadonnées, labels de champs</p>
              <p className="text-xs text-[#6B7280]">12px · regular · gray-500</p>
            </div>
          </div>
        </section>

        {/* ── Boutons ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Boutons</h2>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 space-y-3">
            <button className="w-full rounded-xl bg-[#16A34A] px-4 py-3 text-sm font-semibold text-white">
              Ajouter une recette
            </button>
            <button className="w-full rounded-xl bg-[#F59E0B] px-4 py-3 text-sm font-semibold text-white">
              Voir les prix
            </button>
            <button className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm font-semibold text-[#374151]">
              Annuler
            </button>
            <button className="w-full rounded-xl bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#EF4444]">
              Supprimer
            </button>
          </div>
        </section>

        {/* ── Card Recette ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Card — Recette</h2>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden">
            {/* Image placeholder */}
            <div className="h-36 bg-[#F0FDF4] flex items-center justify-center">
              <span className="text-5xl">🥗</span>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-semibold text-[#111827]">Salade niçoise</p>
                {/* Nutriscore badge */}
                <span className="flex-shrink-0 rounded-lg bg-[#16A34A] px-2 py-0.5 text-xs font-bold text-white">A</span>
              </div>
              <p className="text-xs text-[#6B7280]">4 personnes · 20 min prep · 0 min cuisson</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#6B7280]">Prix estimé</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-[#F59E0B]">8,40 €</span>
                  <span className="text-xs text-[#6B7280]">/ pers.</span>
                </div>
              </div>
              {/* Store comparison hint */}
              <div className="flex items-center gap-1.5 rounded-lg bg-[#FFFBEB] px-3 py-2">
                <span className="text-xs">💰</span>
                <p className="text-xs text-[#92400E]">2,10 € moins cher au Lidl cette semaine</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Liste de courses ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Liste de courses — Item</h2>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white divide-y divide-[#E5E7EB]">

            {/* Item non coché */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-5 w-5 flex-shrink-0 rounded-md border-2 border-[#E5E7EB]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#111827]">Tomates cerises</p>
                <p className="text-xs text-[#6B7280]">500 g · Carrefour · 2,49 €</p>
              </div>
              <span className="text-xs font-semibold text-[#F59E0B]">2,49 €</span>
            </div>

            {/* Item coché */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB]">
              <div className="h-5 w-5 flex-shrink-0 rounded-md border-2 border-[#16A34A] bg-[#16A34A] flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#9CA3AF] line-through">Olives noires</p>
                <p className="text-xs text-[#9CA3AF]">100 g · Leclerc · 1,20 €</p>
              </div>
              <span className="text-xs font-semibold text-[#9CA3AF]">1,20 €</span>
            </div>

            {/* Item avec alternative */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-5 w-5 flex-shrink-0 rounded-md border-2 border-[#E5E7EB]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#111827]">Thon en boîte</p>
                <p className="text-xs text-[#6B7280]">200 g · Carrefour · 3,80 €</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className="rounded-full bg-[#F0FDF4] px-2 py-0.5 text-xs font-medium text-[#16A34A]">
                    Alt. moins chère →
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#F59E0B]">3,80 €</span>
            </div>

          </div>
        </section>

        {/* ── Badges Nutriscore ── */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Badges — Nutri-Score</h2>
          <div className="flex gap-2 flex-wrap rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4">
            {[
              { grade: "A", color: "bg-[#038141]" },
              { grade: "B", color: "bg-[#85BB2F]" },
              { grade: "C", color: "bg-[#FECB02]", text: "text-[#111827]" },
              { grade: "D", color: "bg-[#EE8100]" },
              { grade: "E", color: "bg-[#E63E11]" },
            ].map(({ grade, color, text }) => (
              <span
                key={grade}
                className={`${color} ${text ?? "text-white"} flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold`}
              >
                {grade}
              </span>
            ))}
            <span className="text-xs text-[#6B7280] self-center ml-1">Nutri-Score officiel</span>
          </div>
        </section>

        {/* ── Tab Bars ── */}
        <section className="space-y-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Tab Bar — Propositions</h2>

          {/* Option A — Pill flottante */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#6B7280]">A · Pill flottante</p>
            <div className="rounded-2xl bg-white p-3 shadow-lg shadow-black/8 border border-[#E5E7EB]">
              <div className="flex items-center justify-around">
                {/* Active */}
                <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-[#16A34A]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01"/></svg>
                  <span className="text-[10px] font-semibold text-white">Planning</span>
                </div>
                {/* Inactive */}
                {[
                  { label: "Recettes", d: "M12 2a7 7 0 0 1 7 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 0 1 7-7zM8 18h8M9 21h6" },
                  { label: "Courses", d: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" },
                  { label: "Frigo", d: "M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM5 10h14M9 6v2M9 14v4" },
                ].map(({ label, d }) => (
                  <div key={label} className="flex flex-col items-center gap-1 px-4 py-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
                    <span className="text-[10px] font-semibold text-[#9CA3AF]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Option B — Barre classique épurée */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#6B7280]">B · Indicateur haut + fond léger</p>
            <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] bg-white">
              <div className="flex items-center justify-around">
                {/* Active */}
                <div className="flex flex-col items-center gap-1 px-4 pt-0 pb-3 border-t-2 border-[#16A34A]">
                  <div className="mt-2 flex flex-col items-center gap-1">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01"/></svg>
                    <span className="text-[10px] font-semibold text-[#16A34A]">Planning</span>
                  </div>
                </div>
                {[
                  { label: "Recettes", d: "M12 2a7 7 0 0 1 7 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 0 1 7-7zM8 18h8M9 21h6" },
                  { label: "Courses", d: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" },
                  { label: "Frigo", d: "M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM5 10h14M9 6v2M9 14v4" },
                ].map(({ label, d }) => (
                  <div key={label} className="flex flex-col items-center gap-1 px-4 pt-0 pb-3 border-t-2 border-transparent">
                    <div className="mt-2 flex flex-col items-center gap-1">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
                      <span className="text-[10px] font-semibold text-[#9CA3AF]">{label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Option C — Minimaliste icônes seules */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#6B7280]">C · Minimaliste — icônes + dot</p>
            <div className="rounded-2xl border border-[#E5E7EB] bg-white">
              <div className="flex items-center justify-around px-2 py-3">
                {/* Active */}
                <div className="flex flex-col items-center gap-1.5">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01"/></svg>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                </div>
                {[
                  { d: "M12 2a7 7 0 0 1 7 7c0 4-3 6-3 9H8c0-3-3-5-3-9a7 7 0 0 1 7-7zM8 18h8M9 21h6" },
                  { d: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" },
                  { d: "M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM5 10h14M9 6v2M9 14v4" },
                ].map(({ d }, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
                    <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </section>

        <p className="text-center text-xs text-[#9CA3AF] pb-6">— Dev preview only —</p>
      </div>
    </div>
  );
}
