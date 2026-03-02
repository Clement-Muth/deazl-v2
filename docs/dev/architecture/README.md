# Architecture — Vue d'ensemble

Deazl est une app web/mobile construite avec Next.js 16 et déployée sur mobile via Capacitor.

## Principes directeurs

- **Server-first** : Server Components par défaut, `"use client"` uniquement quand nécessaire
- **DDD pragmatique** : Domain-Driven Design sans sur-ingénierie — les entités et règles métier vivent dans le domaine, pas dans les composants UI
- **Vertical Slice** : chaque feature est auto-contenue dans son Bounded Context (`applications/[bc-name]/`)
- **Zéro commentaires** : le code doit être lisible sans annotations

## Bounded Contexts

| Context | Responsabilité |
|---|---|
| `user` | Auth, profil, préférences, onboarding |
| `catalog` | Référentiel d'ingrédients (Open Food Facts) |
| `recipe` | Recettes, instructions, portions |
| `planning` | Planification hebdomadaire des repas |
| `shopping` | Liste de courses, agrégation d'ingrédients |
| `pantry` | Inventaire du frigo/placards |
| `analytics` | Comparaison de prix, suggestions |
