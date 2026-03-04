# Workflow Git

## Repo

[github.com/Clement-Muth/deazl-v2](https://github.com/Clement-Muth/deazl-v2) (privé)

## Branches

| Branche | Usage | Déploiement |
|---|---|---|
| `main` | Production — toujours déployable | Vercel Production |
| `dev` | Intégration — base pour les features | Vercel Preview |
| `feature/[nom]` | Développement d'une feature | Vercel Preview |
| `fix/[nom]` | Correction de bug | Vercel Preview |

## Commits

Format : `type(scope): description courte`

```
feat(planning): add weekly meal grid
fix(shopping): correct item quantity aggregation
refactor(user): extract household size use case
chore(deps): update Capacitor to v8.1
```

Types : `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`

## Pull Requests

- Feature branch → `dev` pour les features
- `dev` → `main` pour les releases
- Le CI doit passer avant merge (typecheck + lint + E2E)

## Releases

```bash
git tag v0.1.0 && git push --tags
```

→ GitHub Release créée automatiquement avec le changelog des commits depuis le tag précédent.

## CI/CD

`.github/workflows/ci.yml` — déclenché sur push/PR vers `main` et `dev` :
1. Typecheck (`bun run typecheck`)
2. Lint (`bun run lint`)
3. E2E Playwright sur Chromium

`.github/workflows/release.yml` — déclenché sur tag `v*` → GitHub Release auto.

Secrets GitHub requis : `SUPABASE_TEST_URL` + `SUPABASE_TEST_ANON_KEY`
