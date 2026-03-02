# ADR-003 — Supabase comme backend

**Statut** : Accepté

## Contexte

L'app a besoin d'auth (email + OAuth social), d'une base de données relationnelle (prix, ingrédients, recettes avec relations), et potentiellement de temps réel (liste de courses partagée).

## Décision

**Supabase** : PostgreSQL + Auth + Storage + Realtime, hébergé.

## Alternatives considérées

### Firebase (Firestore)
- Très bon sur mobile, SDK mature
- Rejeté : NoSQL inadapté aux requêtes de comparaison de prix (jointures, agrégations), vendor lock-in Google

### PlanetScale / Neon + Auth séparée (NextAuth)
- Plus de contrôle, PostgreSQL natif
- Rejeté : configuration plus complexe, Auth à gérer séparément, deux providers au lieu d'un

### Self-hosted PostgreSQL + Lucia Auth
- Contrôle total
- Rejeté : overhead opérationnel trop élevé pour une app early-stage

## Conséquences

- Row Level Security (RLS) obligatoire sur toutes les tables pour la sécurité multi-tenant
- Deux clients Supabase distincts : `client.ts` (navigateur) et `server.ts` (Server Components/Actions)
- `proxy.ts` (pas `middleware.ts`) pour la gestion des cookies auth avec `@supabase/ssr`
