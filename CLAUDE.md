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
- Expo (React Native mobile iOS/Android)
- Open Food Facts API
- **HeroUI Native** (`heroui-native`) — bibliothèque de composants UI mobile. **TOUJOURS utiliser HeroUI pour les composants UI natifs** (Button, etc.). Ne jamais remplacer par des `Pressable` custom ce qui peut être fait avec HeroUI. Exception unique : `BottomSheet` de HeroUI est remplacé par le composant custom `BottomModal` (`bottomModal.tsx`).

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

## Mode de collaboration
- **Débattre avant d'implémenter** : ne jamais coder une solution sans qu'elle ait été discutée et validée ensemble
- **Être critique** : contredire si la solution proposée semble mauvaise, expliquer pourquoi, proposer une alternative
- **Pas d'implémentation unilatérale** : chaque décision technique ou UX se prend ensemble après débat

## Style de code
- **Jamais de commentaires** dans le code (ni `//`, ni `/* */`, ni JSDoc)

## Tests
`bun test`

## Versioning & Releases
Géré proactivement par Claude — pas besoin de demander.

**Source de vérité :** `apps/mobile/app.json` (version visible utilisateur).
**Fichiers à synchroniser à chaque bump :**
- `apps/mobile/app.json` — `version`, `ios.buildString`, `android.versionCode`
- `apps/mobile/package.json`
- `apps/web/package.json`
- `package.json` (root)

**Règles semver :**
- `fix:` commits → patch (1.0.1)
- `feat:` commits → minor (1.1.0)
- Breaking / refonte majeure → major (2.0.0)
- Travail instable → pre-release (1.1.0-beta.1)

**`versionCode` / `buildString` :** entiers auto-incrémentés à chaque bump (obligatoire pour les stores).

**Quand bumper :** à la fin d'une session de travail significative (feature complète, série de fix), pas à chaque commit.

**GitHub Release :** tag `vX.Y.Z` + release notes générées depuis les commits depuis le dernier tag.
