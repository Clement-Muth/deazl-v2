export default function RgpdPage() {
  return (
    <>
      <div style={{ marginBottom: "3rem" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#E8571C", marginBottom: "0.75rem" }}>Légal</p>
        <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: "0.75rem" }}>Vos droits RGPD</h1>
        <p style={{ fontSize: 13, color: "#A8A29E" }}>Dernière mise à jour : 9 mars 2026</p>
      </div>

      <div style={{ padding: "1.25rem 1.5rem", background: "#FFF4EF", borderRadius: 16, border: "1px solid #E8571C20", marginBottom: "3rem" }}>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: "#78716C" }}>
          <strong style={{ color: "#1C1917" }}>En résumé :</strong> Vous avez le contrôle total sur vos données. Vous pouvez les consulter, les modifier, les exporter ou les supprimer à tout moment. Vos données ne sont jamais vendues ni utilisées à des fins publicitaires.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        <Section title="Vos droits en vertu du RGPD">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {[
              { title: "Droit d'accès", desc: "Vous pouvez obtenir à tout moment une copie de toutes vos données personnelles que nous détenons.", action: "Demander via hello@deazl.fr" },
              { title: "Droit de rectification", desc: "Si vos données sont inexactes ou incomplètes, vous pouvez les corriger dans les paramètres de l'application ou en nous contactant.", action: "Via les paramètres de l'app" },
              { title: "Droit à l'effacement", desc: "Vous pouvez demander la suppression de votre compte et de toutes vos données. Traitement sous 30 jours.", action: "Paramètres > Supprimer le compte" },
              { title: "Droit à la portabilité", desc: "Vous pouvez récupérer vos données dans un format structuré (JSON) pour les transférer à un autre service.", action: "Demander via hello@deazl.fr" },
              { title: "Droit d'opposition", desc: "Vous pouvez vous opposer au traitement de vos données à des fins de prospection ou d'amélioration du service.", action: "Demander via hello@deazl.fr" },
              { title: "Droit à la limitation", desc: "Vous pouvez demander la suspension temporaire du traitement de vos données pendant une vérification.", action: "Demander via hello@deazl.fr" },
            ].map((right) => (
              <div key={right.title} style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 16, padding: "1.25rem" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1C1917", marginBottom: "0.5rem" }}>{right.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "#78716C", marginBottom: "0.75rem" }}>{right.desc}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#E8571C" }}>→ {right.action}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Données que nous collectons">
          {[
            { cat: "Compte", data: "E-mail, mot de passe (haché), préférences alimentaires", base: "Exécution du contrat", retention: "Durée du compte + 30j" },
            { cat: "Contenu", data: "Recettes, listes de courses, planning, stock", base: "Exécution du contrat", retention: "Durée du compte + 30j" },
            { cat: "Technique", data: "IP, navigateur, logs d'erreurs", base: "Intérêt légitime", retention: "30 jours" },
            { cat: "Communications", data: "Historique des e-mails transactionnels", base: "Intérêt légitime", retention: "1 an" },
          ].map((row) => (
            <div key={row.cat} style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 120px", gap: "1rem", padding: "0.75rem 0", borderBottom: "1px solid #F5F3EF", alignItems: "start", fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: "#1C1917" }}>{row.cat}</span>
              <span style={{ color: "#57534E" }}>{row.data}</span>
              <span style={{ color: "#78716C" }}>{row.base}</span>
              <span style={{ color: "#A8A29E", textAlign: "right" }}>{row.retention}</span>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 120px", gap: "1rem", padding: "0.5rem 0", fontSize: 11, color: "#A8A29E" }}>
            <span>Catégorie</span><span>Données</span><span>Base légale</span><span style={{ textAlign: "right" }}>Rétention</span>
          </div>
        </Section>

        <Section title="Sous-traitants (processeurs)">
          {[
            { name: "Supabase", role: "Base de données et authentification", localisation: "EU (Irlande — AWS eu-west-1)", lien: "https://supabase.com/privacy" },
            { name: "Vercel", role: "Hébergement application web", localisation: "EU (principalement)", lien: "https://vercel.com/legal/privacy-policy" },
          ].map((proc) => (
            <div key={proc.name} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "0.875rem 0", borderBottom: "1px solid #F5F3EF" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1C1917" }}>{proc.name}</p>
                <p style={{ fontSize: 13, color: "#78716C" }}>{proc.role} · {proc.localisation}</p>
              </div>
              <a href={proc.lien} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#E8571C", textDecoration: "none", fontWeight: 600, flexShrink: 0 }}>Politique →</a>
            </div>
          ))}
        </Section>

        <Section title="Exercer vos droits">
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "#57534E", marginBottom: "1rem" }}>
            Pour exercer l'un de vos droits, contactez notre délégué à la protection des données :
          </p>
          <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 16, padding: "1.25rem" }}>
            <p style={{ fontSize: 14, color: "#1C1917", marginBottom: "0.375rem" }}>
              <strong>E-mail :</strong>{" "}
              <a href="mailto:privacy@deazl.fr" style={{ color: "#E8571C", textDecoration: "none", fontWeight: 600 }}>privacy@deazl.fr</a>
            </p>
            <p style={{ fontSize: 13, color: "#78716C" }}>Délai de réponse : 30 jours maximum (1 mois, conformément au RGPD)</p>
          </div>
          <p style={{ fontSize: 13, color: "#A8A29E", marginTop: "1rem" }}>
            Vous avez également le droit d'introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) :{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: "#E8571C", textDecoration: "none" }}>www.cnil.fr</a>
          </p>
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1C1917", marginBottom: "1rem" }}>{title}</h2>
      {children}
    </div>
  );
}
