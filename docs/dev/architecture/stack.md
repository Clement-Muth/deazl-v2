# Stack technique

## Frontend

| Outil | Version | Rôle |
|---|---|---|
| Next.js | 16 | Framework React, App Router, Server Actions |
| React | 19 | UI |
| TypeScript | strict | Typage |
| Tailwind CSS | v4 | Styles (inline utilities uniquement) |
| shadcn/ui | latest | Composants interactifs complexes |

## Backend / Infrastructure

| Outil | Rôle |
|---|---|
| Supabase | PostgreSQL + Auth (email, Google OAuth) |
| Open Food Facts API | Référentiel produits alimentaires |

## Mobile

| Outil | Version | Rôle |
|---|---|---|
| Capacitor | v8 | Wrapper iOS/Android du build Next.js static |

## Tooling

| Outil | Rôle |
|---|---|
| Bun | Package manager + runtime (remplace npm/npx/node) |
| ESLint | Lint |

## Commandes clés

```bash
bun install
bun run dev
bun run build
NEXT_PUBLIC_BUILD_TARGET=mobile bun run build
bun test
bunx <package>
```
