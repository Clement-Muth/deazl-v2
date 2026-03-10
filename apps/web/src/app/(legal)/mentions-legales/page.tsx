export default function MentionsLegalesPage() {
  return (
    <>
      <div style={{ marginBottom: "3rem" }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#E8571C", marginBottom: "0.75rem" }}>Légal</p>
        <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: "0.75rem" }}>Mentions légales</h1>
        <p style={{ fontSize: 13, color: "#A8A29E" }}>Dernière mise à jour : 9 mars 2026</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        <Section title="Éditeur du site">
          <Row label="Éditeur" value="Clément Muth" />
          <Row label="Nature" value="Projet personnel — personne physique" />
          <Row label="Pays" value="France" />
          <Row label="Responsable de publication" value="Clément Muth" />
          <Row label="Contact" value="hello@deazl.fr" />
        </Section>

        <Section title="Hébergement">
          <Row label="Application web" value="Vercel Inc. — 440 N Barranca Ave #4133, Covina, CA 91723, USA" />
          <Row label="Base de données" value="Supabase Inc. — Serveurs AWS eu-west-1 (Irlande)" />
          <Row label="CDN" value="Vercel Edge Network" />
        </Section>

        <Section title="Propriété intellectuelle">
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "#57534E" }}>
            L'ensemble des éléments constituant le site Deazl (textes, graphiques, logiciels, photographies, images, sons, plans, noms, logos, marques, créations et œuvres protégeables diverses, bases de données…) sont la propriété exclusive de Clément Muth.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "#57534E", marginTop: "0.75rem" }}>
            Toute reproduction totale ou partielle de ces éléments est strictement interdite sans l'autorisation expresse et préalable de Clément Muth.
          </p>
        </Section>

        <Section title="Limitation de responsabilité">
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "#57534E" }}>
            Clément Muth s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, Clément Muth ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur ce site.
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "#57534E", marginTop: "0.75rem" }}>
            Clément Muth décline toute responsabilité pour tout dommage résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations mises à disposition sur le site.
          </p>
        </Section>

        <Section title="Liens hypertextes">
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "#57534E" }}>
            Le site Deazl peut contenir des liens hypertextes vers d'autres sites internet. Clément Muth n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
          </p>
        </Section>

        <Section title="Droit applicable">
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "#57534E" }}>
            Le présent site est soumis au droit français. En cas de litige, les tribunaux français seront seuls compétents.
          </p>
        </Section>

        <Section title="Médiation de la consommation">
          <p style={{ fontSize: 14, lineHeight: 1.75, color: "#57534E" }}>
            Conformément aux dispositions du Code de la consommation, vous avez la possibilité de recourir à un médiateur de la consommation en vue de la résolution amiable d'un litige. Plateforme européenne de résolution des litiges :{" "}
            <a href="https://ec.europa.eu/consumers/odr" style={{ color: "#E8571C", textDecoration: "none" }}>https://ec.europa.eu/consumers/odr</a>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "1rem", padding: "0.625rem 0", borderBottom: "1px solid #F5F3EF", flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#78716C", minWidth: 180, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1C1917" }}>{value}</span>
    </div>
  );
}
