# Deazl

Smart meal planning & grocery management — application mobile iOS/Android + landing web.

## Vision

Planifier ses repas de la semaine ne devrait pas être une corvée. Deazl génère automatiquement ta liste de courses depuis tes recettes, compare les prix par magasin et suggère les meilleures alternatives santé/budget.

## Stack

| | Tech |
|---|---|
| Mobile | Expo (React Native) · HeroUI Native · Expo Router |
| Web | Next.js 16 · Tailwind CSS v4 · shadcn/ui |
| Backend | Supabase (PostgreSQL · Auth · Storage) |
| Monorepo | Bun workspaces |
| i18n | Lingui.js |

## Architecture

DDD pragmatique + Vertical Slice. Chaque bounded context dans `src/applications/[bc-name]/` :

```
apps/
  mobile/          # App Expo (iOS/Android)
  web/             # Next.js (landing + /r/[id] partage recettes)
supabase/
  migrations/      # Migrations SQL
  templates/       # Templates emails
```

**Bounded contexts :** `catalog` · `recipe` · `planning` · `shopping` · `pantry` · `analytics` · `user`

## Lancer le projet

### Prérequis

- [Bun](https://bun.sh) `>= 1.0`
- [Expo Go](https://expo.dev/go) ou simulateur iOS/Android

### Installation

```bash
bun install
```

### Web (landing)

```bash
bun dev
# → http://localhost:3002
```

### Mobile

```bash
bun mobile
# Scanner le QR code avec Expo Go
```

### Variables d'environnement

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**`apps/mobile/.env`**
```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Workflow

| Branche | Rôle | Déploiement |
|---|---|---|
| `staging` | Développement quotidien | Vercel preview |
| `main` | Production | Vercel production |

Les merges vers `main` se font via PR depuis `staging`. La CI (typecheck) doit passer.

## Versioning

Semver — géré dans `apps/mobile/app.json` (source de vérité), synchronisé dans tous les `package.json`.

Voir les [releases](https://github.com/Clement-Muth/deazl-v2/releases).
