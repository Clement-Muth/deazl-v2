# Conventions de code

## Règles absolues

- **Zéro commentaires** dans le code — ni `//`, ni `/* */`, ni JSDoc. Le code doit se documenter lui-même.
- **TypeScript strict** — pas de `any`, pas de `// @ts-ignore`
- **Server Components par défaut** — `"use client"` uniquement si l'interactivité le requiert (state, events, browser APIs)

## Nommage

| Contexte | Convention | Exemple |
|---|---|---|
| Fichiers dans `applications/` | camelCase | `saveHouseholdSize.ts` |
| Fichiers Next.js imposés | kebab-case ou nom fixe | `page.tsx`, `layout.tsx` |
| Composants React | PascalCase | `HouseholdPage` |
| Variables / fonctions | camelCase | `householdSize` |
| Tables SQL | snake_case | `meal_plans` |

## Tailwind CSS

- Classes utilitaires inline uniquement — pas de `@apply`, pas de CSS custom
- Tokens via les classes sémantiques : `bg-primary`, `text-foreground`, `border-border`
- Pas de valeurs arbitraires quand une classe Tailwind v4 existe : `rotate-15` pas `rotate-[15deg]`

## Server Actions

- Vivent dans `applications/[bc]/application/useCases/`
- Un fichier = un use case
- Retournent via `redirect()` ou retournent des données typées

## Composants

- SRP (Single Responsibility Principle) : un composant = une responsabilité
- Sous-dossiers par feature dans `ui/components/`
- Pas de composants > ~150 lignes sans bonne raison
