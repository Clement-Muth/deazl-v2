export default function ConfidentialitePage() {
  return <LegalPage title="Politique de confidentialité" updated="9 mars 2026" sections={sections} />;
}

const sections = [
  {
    title: "1. Qui sommes-nous ?",
    content: `Deazl est un projet personnel développé et exploité par Clément Muth, développeur indépendant basé en France. Pour toute question relative à vos données personnelles, vous pouvez me contacter à l'adresse : privacy@deazl.fr`,
  },
  {
    title: "2. Données collectées",
    content: `Nous collectons uniquement les données nécessaires au fonctionnement du service :

• **Données de compte** : adresse e-mail, mot de passe (haché), préférences alimentaires, métadonnées d'onboarding.
• **Données d'utilisation** : recettes créées ou importées, listes de courses, planning hebdomadaire, articles du stock (garde-manger).
• **Données techniques** : adresse IP, type de navigateur, système d'exploitation, journaux d'erreurs (logs). Ces données sont anonymisées sous 30 jours.

Nous ne collectons pas de données de géolocalisation précise, ni de données biométriques.`,
  },
  {
    title: "3. Finalités du traitement",
    content: `Vos données sont utilisées pour :

• Fournir et améliorer le service Deazl.
• Envoyer des notifications de rappel (expiration de produits, liste de courses) si vous y avez consenti.
• Assurer la sécurité et prévenir les fraudes.
• Respecter nos obligations légales.

Nous ne vendons jamais vos données à des tiers et ne les utilisons pas à des fins publicitaires.`,
  },
  {
    title: "4. Base légale",
    content: `Le traitement de vos données repose sur :

• **L'exécution du contrat** (Article 6.1.b RGPD) : pour fournir le service que vous avez demandé.
• **Le consentement** (Article 6.1.a RGPD) : pour les notifications push.
• **L'intérêt légitime** (Article 6.1.f RGPD) : pour la sécurité et l'amélioration du service.`,
  },
  {
    title: "5. Conservation des données",
    content: `Vos données sont conservées aussi longtemps que votre compte est actif. En cas de suppression de compte, vos données sont effacées dans un délai de 30 jours, à l'exception des données nécessaires au respect de nos obligations légales (données de facturation conservées 10 ans).`,
  },
  {
    title: "6. Hébergement et transferts",
    content: `Nos serveurs sont hébergés en Europe (Irlande) via Supabase (AWS eu-west-1). Aucune donnée n'est transférée hors de l'Union Européenne sans les garanties appropriées (clauses contractuelles types de la Commission Européenne).`,
  },
  {
    title: "7. Partage des données",
    content: `Nous pouvons partager vos données avec :

• **Supabase** (base de données et authentification) — hébergement EU.
• **Vercel** (hébergement de l'application web) — traitement sous DPA.
• **Prestataires techniques** requis pour le fonctionnement du service, liés par des contrats de sous-traitance conformes au RGPD.

Aucune donnée n'est vendue ou partagée avec des annonceurs.`,
  },
  {
    title: "8. Vos droits",
    content: `Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :

• **Droit d'accès** : obtenir une copie de vos données.
• **Droit de rectification** : corriger des données inexactes.
• **Droit à l'effacement** : demander la suppression de vos données.
• **Droit à la portabilité** : recevoir vos données dans un format structuré.
• **Droit d'opposition** : vous opposer à certains traitements.
• **Droit à la limitation** : demander la suspension d'un traitement.

Pour exercer ces droits : privacy@deazl.fr. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
  },
  {
    title: "9. Cookies",
    content: `Deazl utilise uniquement des cookies strictement nécessaires au fonctionnement du service (session d'authentification, préférences de langue). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.`,
  },
];

function LegalPage({ title, updated, sections }: {
  title: string;
  updated: string;
  sections: { title: string; content: string }[];
}) {
  return (
    <>
      <div style={{ marginBottom: "3rem" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#E8571C", marginBottom: "0.75rem" }}>Légal</p>
        <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: "0.75rem" }}>{title}</h1>
        <p style={{ fontSize: 13, color: "#A8A29E" }}>Dernière mise à jour : {updated}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {sections.map((s) => (
          <div key={s.title}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#1C1917", marginBottom: "0.75rem" }}>{s.title}</h2>
            <div style={{ fontSize: 14, lineHeight: 1.75, color: "#57534E", whiteSpace: "pre-line" }}>
              {s.content.split(/\*\*(.+?)\*\*/).map((part, i) =>
                i % 2 === 1
                  ? <strong key={i} style={{ color: "#1C1917", fontWeight: 700 }}>{part}</strong>
                  : part
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "3rem", padding: "1.5rem", background: "#FFF4EF", borderRadius: 16, border: "1px solid #E8571C20" }}>
        <p style={{ fontSize: 14, color: "#78716C" }}>
          <strong style={{ color: "#1C1917" }}>Contact DPO :</strong> Pour toute question relative à vos données personnelles, écrivez-nous à{" "}
          <a href="mailto:privacy@deazl.fr" style={{ color: "#E8571C", fontWeight: 600, textDecoration: "none" }}>privacy@deazl.fr</a>
        </p>
      </div>
    </>
  );
}
