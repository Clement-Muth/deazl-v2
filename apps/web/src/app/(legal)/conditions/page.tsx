export default function ConditionsPage() {
  return <LegalPage title="Conditions d'utilisation" updated="9 mars 2026" sections={sections} />;
}

const sections = [
  {
    title: "1. Acceptation des conditions",
    content: `En vous inscrivant et en utilisant Deazl, vous acceptez sans réserve les présentes conditions générales d'utilisation (CGU). Si vous n'acceptez pas ces conditions, n'utilisez pas le service.`,
  },
  {
    title: "2. Description du service",
    content: `Deazl est une application web et mobile de planification de repas et de gestion de courses qui permet de :

• Créer et importer des recettes depuis des sites tiers.
• Générer automatiquement des listes de courses à partir d'un planning hebdomadaire.
• Gérer un stock d'aliments (garde-manger).
• Comparer les prix entre différents points de vente.
• Partager des listes de courses en temps réel avec d'autres membres du foyer.`,
  },
  {
    title: "3. Inscription et compte",
    content: `Pour utiliser Deazl, vous devez créer un compte avec une adresse e-mail valide. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les actions effectuées depuis votre compte. Vous devez avoir au moins 16 ans pour créer un compte.

Nous nous réservons le droit de suspendre ou supprimer tout compte en cas d'utilisation abusive, frauduleuse ou contraire aux présentes CGU.`,
  },
  {
    title: "4. Utilisation acceptable",
    content: `Vous vous engagez à ne pas :

• Utiliser Deazl à des fins illégales ou frauduleuses.
• Tenter d'accéder sans autorisation aux systèmes ou données d'autres utilisateurs.
• Scraper, reproduire ou redistribuer le contenu de l'application de manière automatisée.
• Télécharger ou partager du contenu portant atteinte aux droits de tiers.
• Utiliser le service de manière à perturber son fonctionnement pour les autres utilisateurs.`,
  },
  {
    title: "5. Contenu utilisateur",
    content: `Vous restez propriétaire du contenu que vous créez dans Deazl (recettes, listes, notes). En utilisant le service, vous nous accordez une licence non exclusive, mondiale et gratuite pour héberger, stocker et afficher ce contenu dans le seul but de vous fournir le service.

Pour les recettes importées depuis des sites tiers, vous êtes responsable du respect des droits d'auteur de ces sites.`,
  },
  {
    title: "6. Disponibilité du service",
    content: `Deazl est fourni « en l'état ». Nous nous efforçons d'assurer une disponibilité maximale mais ne garantissons pas une disponibilité ininterrompue. Des maintenances programmées ou des incidents techniques peuvent entraîner des interruptions. Nous ne serons pas responsables des dommages résultant d'une indisponibilité du service.`,
  },
  {
    title: "7. Propriété intellectuelle",
    content: `L'application Deazl, son code source, son design, ses marques et logos sont la propriété exclusive de Clément Muth (Deazl) et sont protégés par les lois sur la propriété intellectuelle. Toute reproduction, modification ou distribution sans autorisation écrite est interdite.`,
  },
  {
    title: "8. Limitation de responsabilité",
    content: `Dans les limites autorisées par la loi, Clément Muth (Deazl) ne pourra être tenu responsable de dommages indirects, accessoires ou consécutifs résultant de l'utilisation ou de l'impossibilité d'utiliser le service. Notre responsabilité totale ne pourra excéder les sommes éventuellement payées par l'utilisateur pour le service au cours des 12 derniers mois.`,
  },
  {
    title: "9. Modifications des CGU",
    content: `Nous nous réservons le droit de modifier ces CGU à tout moment. Les modifications importantes seront notifiées par e-mail ou via l'application avec un préavis de 30 jours. La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles conditions.`,
  },
  {
    title: "10. Résiliation",
    content: `Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l'application. Nous pouvons résilier votre accès en cas de violation des présentes CGU, avec notification préalable sauf en cas de violation grave.`,
  },
  {
    title: "11. Droit applicable",
    content: `Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents. En cas de litige avec un consommateur, une médiation peut être envisagée via la plateforme européenne de règlement en ligne des litiges (https://ec.europa.eu/consumers/odr).`,
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
    </>
  );
}
