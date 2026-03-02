# Structure du code

```
src/
├── app/
│   ├── (app)/               # Routes protégées (app principale)
│   │   ├── planning/
│   │   ├── recipes/
│   │   ├── shopping/
│   │   ├── pantry/
│   │   └── analytics/
│   ├── (onboarding)/        # Flux d'onboarding (3 étapes)
│   │   └── onboarding/
│   │       ├── welcome/
│   │       ├── household/
│   │       └── stores/
│   ├── (auth)/              # Connexion / inscription
│   └── globals.css
├── applications/            # Bounded Contexts (DDD)
│   ├── user/
│   │   ├── api/             # React Query hooks + wrappers Server Actions
│   │   ├── domain/          # Entités, Value Objects, interfaces Repository
│   │   ├── application/     # Use cases / Server Actions
│   │   │   └── useCases/
│   │   ├── infrastructure/  # Adapters (Supabase, etc.)
│   │   └── ui/              # Composants React propres à ce BC
│   ├── catalog/
│   ├── recipe/
│   ├── planning/
│   ├── shopping/
│   ├── pantry/
│   └── analytics/
├── shared/
│   └── components/
│       └── ui/              # Composants shadcn/ui
└── lib/
    └── supabase/
        ├── client.ts        # Client navigateur
        ├── server.ts        # Client serveur
        └── middleware.ts    # Auth middleware (appelé depuis proxy.ts)
```

## Règles de nommage

- Fichiers dans `applications/` : **camelCase** (`useCases/`, `authForm.tsx`)
- Exception : fichiers imposés par Next.js (`page.tsx`, `layout.tsx`, `route.ts`, `proxy.ts`)
- Un composant = une responsabilité (SRP)
