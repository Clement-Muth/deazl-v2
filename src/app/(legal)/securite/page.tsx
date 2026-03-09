export default function SecuritePage() {
  return (
    <>
      <div style={{ marginBottom: "3rem" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#E8571C", marginBottom: "0.75rem" }}>Sécurité</p>
        <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: "0.75rem" }}>Sécurité & cybersécurité</h1>
        <p style={{ fontSize: 13, color: "#A8A29E" }}>Dernière mise à jour : 9 mars 2026</p>
      </div>

      <div style={{ padding: "1.25rem 1.5rem", background: "#FFF4EF", borderRadius: 16, border: "1px solid #E8571C20", marginBottom: "3rem" }}>
        <p style={{ fontSize: 14, lineHeight: 1.65, color: "#78716C" }}>
          <strong style={{ color: "#1C1917" }}>Notre engagement :</strong> La sécurité de vos données est une priorité absolue. Nous appliquons les meilleures pratiques de l'industrie pour protéger vos informations.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1C1917", marginBottom: "1rem" }}>Mesures de sécurité techniques</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {[
              {
                icon: "🔐",
                title: "Chiffrement en transit",
                desc: "Toutes les communications entre votre navigateur/application et nos serveurs sont chiffrées via TLS 1.3. Certificats SSL renouvelés automatiquement.",
              },
              {
                icon: "🗄️",
                title: "Chiffrement au repos",
                desc: "Vos données stockées dans la base de données sont chiffrées au repos (AES-256) via Supabase sur AWS eu-west-1.",
              },
              {
                icon: "🔑",
                title: "Authentification sécurisée",
                desc: "Les mots de passe sont hachés avec bcrypt (coût 10+). Nous ne stockons jamais de mots de passe en clair. Support de l'authentification OAuth (Google).",
              },
              {
                icon: "🛡️",
                title: "Row Level Security (RLS)",
                desc: "Chaque requête à la base de données est contrôlée par des politiques RLS Supabase : vous ne pouvez accéder qu'à vos propres données, sans exception.",
              },
              {
                icon: "🔒",
                title: "Clés d'API sécurisées",
                desc: "Les clés d'API sensibles (service role) ne sont jamais exposées côté client. Toutes les opérations privilégiées passent par des Server Actions Next.js.",
              },
              {
                icon: "🌍",
                title: "Hébergement EU",
                desc: "Serveurs hébergés en Irlande (EU). Conformité RGPD. Aucun transfert de données hors de l'Espace Économique Européen sans garanties appropriées.",
              },
            ].map((item) => (
              <div key={item.title} style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 16, padding: "1.25rem" }}>
                <div style={{ fontSize: 24, marginBottom: "0.75rem" }}>{item.icon}</div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1C1917", marginBottom: "0.5rem" }}>{item.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "#78716C" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1C1917", marginBottom: "1rem" }}>Sécurité applicative</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              ["Protection CSRF", "Tokens CSRF intégrés dans toutes les Server Actions Next.js."],
              ["Validation des entrées", "Toutes les données utilisateur sont validées et sanitisées côté serveur avant traitement."],
              ["Headers de sécurité", "CSP, HSTS, X-Frame-Options, X-Content-Type-Options configurés sur toutes les réponses HTTP."],
              ["Mises à jour de sécurité", "Dépendances mises à jour régulièrement. Audits de sécurité npm automatisés en CI/CD."],
              ["Authentification Supabase", "Session JWT signés, rotation automatique des refresh tokens, expiration configurable."],
              ["Rate limiting", "Limitation du nombre de requêtes par IP pour prévenir les attaques par force brute sur l'authentification."],
            ].map(([titre, desc]) => (
              <div key={titre} style={{ display: "flex", gap: "1rem", padding: "0.875rem 1rem", background: "#fff", border: "1px solid #E8E5E0", borderRadius: 12, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#FFF4EF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <svg width="9" height="9" viewBox="0 0 10 8"><polyline points="1 4 3.5 6.5 9 1" stroke="#E8571C" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#1C1917", marginBottom: "0.25rem" }}>{titre}</p>
                  <p style={{ fontSize: 13, color: "#78716C", lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1C1917", marginBottom: "1rem" }}>Gestion des incidents</h2>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "#57534E", marginBottom: "1rem" }}>
            En cas d'incident de sécurité affectant vos données personnelles, nous nous engageons à :
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {[
              ["Détection", "Identifier et contenir l'incident dans les plus brefs délais."],
              ["72 heures", "Notifier la CNIL dans les 72 heures suivant la détection de la violation."],
              ["Notification", "Vous informer directement si la violation est susceptible d'engendrer un risque élevé pour vos droits et libertés."],
              ["Remédiation", "Mettre en place les mesures correctives nécessaires et publier un post-mortem."],
            ].map(([etape, desc]) => (
              <div key={etape} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#E8571C", minWidth: 80, paddingTop: 2 }}>{etape}</span>
                <p style={{ fontSize: 13, color: "#57534E", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1C1917", marginBottom: "1rem" }}>Signaler une vulnérabilité</h2>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "#57534E", marginBottom: "1rem" }}>
            Si vous découvrez une vulnérabilité de sécurité dans Deazl, nous vous encourageons à nous la signaler de manière responsable (responsible disclosure).
          </p>
          <div style={{ background: "#fff", border: "1px solid #E8E5E0", borderRadius: 16, padding: "1.25rem" }}>
            <p style={{ fontSize: 14, color: "#1C1917", marginBottom: "0.5rem" }}>
              <strong>Contact sécurité :</strong>{" "}
              <a href="mailto:security@deazl.fr" style={{ color: "#E8571C", textDecoration: "none", fontWeight: 600 }}>security@deazl.fr</a>
            </p>
            <p style={{ fontSize: 13, color: "#78716C", lineHeight: 1.6 }}>
              Merci d'inclure une description détaillée de la vulnérabilité, les étapes pour la reproduire et son impact potentiel. Nous nous engageons à accuser réception sous 48h et à vous tenir informé des corrections apportées.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
