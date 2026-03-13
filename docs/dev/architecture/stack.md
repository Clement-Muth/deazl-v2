# Stack technique

## Mobile

| Outil | Rôle |
|---|---|
| [Expo](https://expo.dev) (React Native) | Framework mobile iOS / Android |
| [Expo Router](https://expo.github.io/router) | Routing file-based |
| [HeroUI Native](https://heroui.net) | Composants UI natifs |
| [Reanimated 4](https://docs.swmansion.com/react-native-reanimated/) | Animations |
| [Gorhom Bottom Sheet](https://github.com/gorhom/react-native-bottom-sheet) | Modales bottom sheet |
| Tailwind CSS v4 + Uniwind | Styles utilitaires |

## Web

| Outil | Rôle |
|---|---|
| Next.js 16 (App Router) | Landing page + partage recettes (`/r/[id]`) |
| Tailwind CSS v4 + shadcn/ui | UI web |
| Lingui.js | Internationalisation |

## Backend

| Outil | Rôle |
|---|---|
| Supabase | PostgreSQL + Auth + Storage |
| Open Food Facts API | Base de données produits alimentaires |

## Monorepo & tooling

| Outil | Rôle |
|---|---|
| Bun | Package manager + runtime (`bun install`, `bun run`) |
| Bun workspaces | Monorepo (`apps/*`) |
| TypeScript strict | Typage |

## À noter

- **Toujours `bun`** — jamais npm, yarn ou npx. Utiliser `bunx` à la place de `npx`.
- **HeroUI pour tout composant UI mobile** — ne jamais créer un `Pressable` custom quand HeroUI a un `Button`. Exception unique : le `BottomSheet` HeroUI est remplacé par `BottomModal` custom (`bottomModal.tsx`).
