# Tests

## Stratégie

| Type | Outil | Quand |
|---|---|---|
| E2E | Playwright | Flows critiques (auth, onboarding) |
| Unit | Bun test | Logique métier du domaine |

Les tests de composants React ne sont pas écrits — les pages d'onboarding sont quasi-statiques et les E2E couvrent l'essentiel.

## Lancer les tests

```bash
bun run test:e2e           # headless
bun run test:e2e:ui        # interface visuelle Playwright
bun run test:e2e:report    # rapport HTML du dernier run
```

## Structure

```
e2e/
├── helpers/
│   └── auth.ts            — signUp(), signIn(), TEST_USER
├── auth.spec.ts            — sign up, sign in, erreur, redirect non-auth
└── onboarding.spec.ts      — welcome, household→stores, stores→planning, retour
```

## Config Playwright

- Base URL : `http://localhost:3002`
- Browser : Chromium uniquement
- `webServer` : démarre `bun run dev` automatiquement si le serveur n'est pas déjà lancé
- En CI : 1 retry, upload du rapport HTML en artefact si échec

## Variables d'environnement requises pour le CI

```
SUPABASE_TEST_URL=...
SUPABASE_TEST_ANON_KEY=...
```

Configurées comme secrets GitHub (`SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`).
