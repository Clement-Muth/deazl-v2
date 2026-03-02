# ADR-005 — Tailwind CSS v4

**Statut** : Accepté

## Contexte

Choix du système de style pour l'app.

## Décision

**Tailwind CSS v4** avec tokens via `@theme {}` dans `globals.css`. Pas de CSS custom, tout en classes utilitaires inline.

## Alternatives considérées

### Tailwind v3
- Plus stable, documentation exhaustive
- Rejeté : v4 disponible, syntaxe `@theme {}` plus propre pour les design tokens, meilleure performance (pas de purge)

### CSS Modules
- Isolation parfaite, CSS natif
- Rejeté : DX plus lente, pas de colocation styles/JSX

### styled-components / Emotion
- CSS-in-JS, dynamisme total
- Rejeté : overhead runtime, incompatible Server Components

### UnoCSS
- Plus rapide que Tailwind
- Rejeté : écosystème plus petit, moins de ressources

## Conséquences

- Certaines classes Tailwind v4 diffèrent de v3 : `h-0.75` (pas `h-[3px]`), `bg-linear-to-t` (pas `bg-gradient-to-t`), `rotate-15` (pas `rotate-[15deg]`)
- shadcn/ui utilisé pour les composants interactifs complexes (Dialog, Select, etc.) — installé via `bunx shadcn@latest add`
- Classes utilitaires directes uniquement : `bg-primary`, pas `bg-[--color-primary]`
