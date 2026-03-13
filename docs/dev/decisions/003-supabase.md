# ADR-003 — Supabase

## Contexte

Il faut un backend avec authentification, base de données relationnelle et stockage de fichiers.

## Décision

**Supabase** — PostgreSQL + Auth + Storage, hébergé.

## Alternatives évaluées

- **Firebase** — NoSQL (inadapté au modèle relationnel de Deazl), vendor lock-in Google fort.
- **PlanetScale + NextAuth** — plus de configuration à maintenir, pas de Storage intégré.
- **Self-hosted PostgreSQL + Auth maison** — overhead opérationnel non justifié.

## Conséquences

- Row Level Security (RLS) est obligatoire sur toutes les tables.
- Deux clients Supabase à maintenir : `client.ts` (browser) et `server.ts` (Server Components / Server Actions).
- Les migrations SQL sont versionnées dans `supabase/migrations/`.
- Deux projets Supabase : prod (`sqjfvkmgdyardcbpcwan`) et staging (`qccvwajldbzykeekypzc`).
