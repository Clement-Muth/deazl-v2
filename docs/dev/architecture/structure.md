# Structure du projet

```
deazl-v2/
├── apps/
│   ├── mobile/                          # App Expo
│   │   ├── app/                         # Routes Expo Router (file-based)
│   │   ├── assets/                      # Images, fonts, splash
│   │   ├── src/
│   │   │   └── applications/            # Bounded contexts
│   │   │       ├── catalog/
│   │   │       ├── recipe/
│   │   │       ├── planning/
│   │   │       ├── shopping/
│   │   │       ├── pantry/
│   │   │       ├── analytics/
│   │   │       └── user/
│   │   ├── app.json                     # Config Expo (source de vérité version)
│   │   └── package.json
│   │
│   └── web/                             # Next.js
│       └── src/
│           ├── app/                     # Routes App Router
│           ├── applications/            # Bounded contexts web
│           └── lib/supabase/            # Clients Supabase (client.ts / server.ts)
│
├── supabase/
│   ├── migrations/                      # SQL versionnées
│   └── templates/                       # Emails (email_change.html, recovery.html)
│
├── docs/
│   ├── user/                            # Doc utilisateur → docs.deazl.fr
│   └── dev/                             # Cette doc
│
└── .github/
    ├── workflows/                       # CI (typecheck), Release
    ├── ISSUE_TEMPLATE/
    └── pull_request_template.md
```

## Conventions de nommage

| Contexte | Convention |
|---|---|
| Fichiers dans `applications/` | camelCase (`useCases/`, `authForm.tsx`) |
| Fichiers Next.js imposés | kebab-case (`page.tsx`, `layout.tsx`, `route.ts`) |
| Composants React | PascalCase |
| Tables SQL | snake_case |
| Variables CSS Tailwind | classes utilitaires directes (`bg-primary`, pas `bg-[--color-*]`) |
