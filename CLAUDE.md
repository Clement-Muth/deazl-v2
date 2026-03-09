# Deazl v2 — Instructions pour Claude

## Package manager
Toujours utiliser **Bun**.
- `bun install` (pas npm/yarn)
- `bun run <script>`
- `bunx <package>` (pas npx)
- Bun charge automatiquement les `.env`, ne pas utiliser dotenv

## Stack
- Next.js 16, App Router, TypeScript strict
- Tailwind CSS v4 + shadcn/ui (composants interactifs complexes)
- Supabase (PostgreSQL + Auth) — `@supabase/supabase-js` + `@supabase/ssr`
- Capacitor v8 (mobile iOS/Android)
- Open Food Facts API

## Architecture
DDD pragmatique + Vertical Slice. Chaque Bounded Context dans `src/applications/[bc-name]/` avec les couches :
- `api/` — React Query hooks + wrappers Server Actions (consommé par UI)
- `domain/` — Entités, Value Objects, interfaces Repository
- `application/` — Use cases / Server Actions
- `infrastructure/` — Adapters Supabase, OpenFoodFacts, etc.
- `ui/` — Composants React propres à ce BC

Bounded Contexts : catalog | recipe | planning | shopping | pantry | analytics | user

## Conventions de nommage
- **Fichiers et dossiers** dans `applications/` : **camelCase** (ex: `useCases/`, `valueObjects/`, `authForm.tsx`)
- **Exception** : fichiers Next.js imposés (`page.tsx`, `layout.tsx`, `route.ts`, `proxy.ts`)
- **SRP** : un composant = une responsabilité. Fichiers courts. Sous-dossiers par feature dans `ui/components/`
  - Ex: `ui/components/auth/authForm.tsx` + `ui/components/auth/authInput.tsx`
- **Tailwind** : utiliser les classes utilitaires directes (`bg-primary`, `text-foreground`) — pas `bg-[--color-*]`
- **Shadcn** : `bun x shadcn@latest add [component]` pour ajouter. Composants dans `src/shared/components/ui/`

## Conventions Next.js 16
- `src/proxy.ts` (pas middleware.ts) avec `export async function proxy()`
- Supabase navigateur : `src/lib/supabase/client.ts`
- Supabase serveur : `src/lib/supabase/server.ts`
- Auth proxy : `src/lib/supabase/middleware.ts` appelé depuis proxy.ts
- Alias d'import : `@/*` → `./src/*`
- Server Components par défaut, `"use client"` uniquement si nécessaire
- Server Actions dans `application/`
- Build mobile : `NEXT_PUBLIC_BUILD_TARGET=mobile bun run build`

## Internationalisation (i18n)
- **Lingui.js obligatoire** : tout texte affiché à l'utilisateur doit utiliser Lingui — sans exception
- Dans les Server Components et fichiers `.tsx` côté serveur : `import { Trans, t } from "@lingui/macro"` + `<Trans>...</Trans>` ou `` t`...` ``
- Dans les Client Components (`"use client"`) : `import { Trans } from "@lingui/react/macro"`
- Ne jamais écrire de texte UI en dur dans le JSX sans le wrapper `<Trans>` ou `` t`...` ``
- Exemple : `<p><Trans>Mes recettes</Trans></p>`, `placeholder={t\`Rechercher…\`}`

## Style de code
- **Jamais de commentaires** dans le code (ni `//`, ni `/* */`, ni JSDoc)

## Tests
`bun test`
