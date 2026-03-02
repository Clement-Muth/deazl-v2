# ADR-004 — Capacitor pour le mobile

**Statut** : Accepté

## Contexte

Deazl doit être disponible sur iOS et Android. On veut partager le maximum de code avec la version web.

## Décision

**Capacitor v8** : wrapper natif autour du build static Next.js.

## Alternatives considérées

### React Native
- Vrai natif, meilleures performances UI
- Rejeté : codebase séparée du web, duplication de tout le UI

### Expo
- DX excellente, ecosystem riche
- Rejeté : même problème que React Native — pas de partage de code avec Next.js

### PWA uniquement
- Zéro overhead mobile
- Rejeté : pas distribuable sur App Store/Play Store, accès limité aux APIs natives

### Tauri Mobile
- Très léger, Rust
- Rejeté : encore expérimental sur mobile

## Conséquences

- Build mobile via `NEXT_PUBLIC_BUILD_TARGET=mobile bun run build` → active `output: export` dans `next.config.ts`
- Les pages doivent être compatibles static export (pas de `dynamicParams`, no `generateServerSideProps`)
- Certaines features Next.js (Image Optimization, Server Actions) ne fonctionnent pas en mode static — à gérer au cas par cas
