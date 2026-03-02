# ADR-001 — Stack technique

**Statut** : Accepté

## Contexte

Deazl est une app grand public de planification de repas et de courses. Elle doit tourner sur web et mobile (iOS/Android), avec un backend gérant auth, données utilisateur, et potentiellement du temps réel (liste de courses partagée à terme).

## Décision

**Next.js 16 + Bun + Tailwind CSS v4 + Supabase + Capacitor v8**

## Alternatives considérées

### Remix vs Next.js
- Remix aurait été pertinent pour les Server Actions et la gestion des formulaires (pattern loader/action très propre)
- Next.js retenu car écosystème plus large, App Router mature, et meilleure intégration Capacitor

### Vite/React SPA vs Next.js
- SPA aurait simplifié le build Capacitor (pas besoin du flag `output: export`)
- Next.js retenu pour le SEO de la version web et les Server Components (performance, pas de JS côté client inutile)

### Firebase vs Supabase
- Firebase plus mature sur mobile
- Supabase retenu : PostgreSQL (SQL natif, migrations propres, requêtes complexes pour la comparaison de prix), open-source, Auth intégrée

### npm/yarn vs Bun
- Bun retenu pour la vitesse d'installation, le runtime unifié, et le chargement automatique des `.env`

## Conséquences

- Le build mobile nécessite `NEXT_PUBLIC_BUILD_TARGET=mobile` pour activer `output: export` dans `next.config.ts`
- Pas de `getServerSideProps` ou fonctionnalités Next.js incompatibles avec le static export dans les routes mobiles
