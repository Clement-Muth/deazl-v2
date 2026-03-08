# Deazl v2 — Workflow de développement

## Branches

| Branche | Rôle | Déployée sur |
|---------|------|--------------|
| `main` | Production — ce que voient les beta testeurs | Vercel (prod) + Supabase prod |
| `develop` | Développement actif | Vercel (preview) + Supabase staging |
| `feat/*`, `fix/*` | Features / correctifs | PR vers `develop` |

**Règle d'or :** on ne pousse jamais directement sur `main`. Tout passe par `develop`, puis une PR `develop → main` pour chaque release.

## Workflow quotidien

```
# Nouvelle feature
git checkout develop
git pull origin develop
git checkout -b feat/mon-feature

# ... développement ...

git push origin feat/mon-feature
# → ouvrir une PR vers develop sur GitHub
```

## Faire une release vers les beta testeurs

```bash
# 1. PR develop → main (GitHub), merge après review
# 2. Tagger la release
git checkout main && git pull origin main
git tag v0.x.0
git push origin v0.x.0
# → GitHub Release créée automatiquement avec changelog
```

## Environnements Supabase

| Env | Projet Supabase | Usage |
|-----|----------------|-------|
| Production | `deazl-prod` | Beta testeurs — **ne jamais toucher manuellement** |
| Staging/Dev | `deazl-v2` (actuel) | Développement et tests |

## Variables d'environnement Vercel

### Production (branche `main`)
```
NEXT_PUBLIC_SUPABASE_URL    → URL du projet Supabase prod
NEXT_PUBLIC_SUPABASE_ANON_KEY → Anon key du projet Supabase prod
NEXT_PUBLIC_APP_URL         → https://app.deazl.com (ou domaine prod)
```

### Preview (branche `develop`)
```
NEXT_PUBLIC_SUPABASE_URL    → URL du projet Supabase staging
NEXT_PUBLIC_SUPABASE_ANON_KEY → Anon key du projet Supabase staging
NEXT_PUBLIC_APP_URL         → https://develop.deazl-v2.vercel.app
```

## Setup Supabase production (à faire une fois)

1. Aller sur [supabase.com](https://supabase.com) → New project → nommer `deazl-prod`
2. Une fois créé, récupérer **URL** et **anon key** dans Settings → API
3. Appliquer toutes les migrations :
   ```bash
   bunx supabase db push --db-url postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```
4. Activer Realtime sur la table `meal_slots` :
   - Dashboard → Database → Replication → activer `meal_slots`
5. Vérifier que le Storage bucket `recipe-images` est créé (public)
6. Renseigner les env vars dans Vercel (voir section ci-dessus)

## CI/CD

Le CI tourne automatiquement sur chaque push et PR vers `main` ou `develop` :
- **Typecheck & Lint** — doit passer pour merger
- **E2E Tests** — Playwright sur Chromium

Les releases GitHub sont créées automatiquement lors d'un tag `v*`.

## Note sur la protection de branche

La protection de branche sur `main` (empêcher les push directs) nécessite GitHub Pro.
En attendant, convention d'équipe : **toujours passer par une PR**.
