# Architecture

Deazl suit un **DDD pragmatique + Vertical Slice**. Chaque domaine métier est autonome — il possède ses entités, ses cas d'usage, son infrastructure et son UI.

## Bounded Contexts

| Context | Responsabilité |
|---|---|
| `catalog` | Produits Open Food Facts, recherche, scan code-barres |
| `recipe` | Recettes, favoris, partage |
| `planning` | Planification hebdomadaire des repas |
| `shopping` | Liste de courses, session de courses, prix |
| `pantry` | Inventaire du garde-manger |
| `analytics` | Comparaison de prix, suivi des dépenses |
| `user` | Profil, foyer, authentification |

## Structure d'un bounded context

```
src/applications/[bc-name]/
├── domain/           # Entités, Value Objects, interfaces Repository
├── application/      # Use cases (logique métier pure)
├── infrastructure/   # Adapters Supabase, Open Food Facts, etc.
├── ui/               # Composants React Native propres à ce BC
└── api/              # React Query hooks, wrappers use cases
```

## Règle centrale

Un bounded context ne dépend jamais d'un autre bounded context directement. Si une dépendance est nécessaire, elle passe par les interfaces du domaine.
