# Documentation technique — Deazl

Documentation interne pour les développeurs qui travaillent sur le projet.

---

## Structure du repo

```
apps/
├── mobile/     # App Expo (iOS / Android)
└── web/        # Next.js (landing + partage recettes)

supabase/
├── migrations/ # Migrations SQL versionnées
└── templates/  # Emails transactionnels

docs/
├── user/       # Documentation utilisateur (sync → docs.deazl.fr)
└── dev/        # Cette documentation
```

---

## Démarrage rapide

{% content-ref url="setup/README.md" %}
Installer et lancer le projet
{% endcontent-ref %}

---

## Sections

| Section | Contenu |
|---|---|
| [Setup](setup/README.md) | Installation, variables d'environnement |
| [Architecture](architecture/README.md) | Stack, structure, modèle de données |
| [Décisions (ADR)](decisions/README.md) | Pourquoi on a choisi quoi |
| [Workflow](workflow/git.md) | Git, conventions, releases, tests |
