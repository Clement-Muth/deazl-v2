# ADR-005 — Tailwind CSS v4

## Contexte

Il faut un système de style cohérent entre le web et le mobile (autant que possible), rapide à utiliser, compatible avec les Server Components Next.js.

## Décision

**Tailwind CSS v4** avec Uniwind pour le mobile (React Native).

## Alternatives évaluées

- **Tailwind v3** — syntaxe plus ancienne, pas de CSS-native layers.
- **CSS Modules** — verbeux, pas de design tokens partagés.
- **styled-components** — runtime overhead, incompatible avec les Server Components.
- **NativeWind v2** — abandonné au profit de Uniwind qui supporte Tailwind v4.

## Conséquences

- La syntaxe v4 diffère de v3 sur certains points (ex: `h-0.75` au lieu de `h-[3px]`).
- Toujours utiliser les classes utilitaires directes (`bg-primary`, `text-foreground`) — jamais `bg-[--color-*]`.
- Les tokens de design sont définis dans le fichier de config Tailwind et consommés via les classes.
