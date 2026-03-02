# Modèle de données

Base de données PostgreSQL hébergée sur Supabase.

## Tables principales

### `profiles`
Extension de `auth.users` (Supabase Auth). Stocke les préférences utilisateur.

| Colonne | Type | Description |
|---|---|---|
| `id` | uuid (FK auth.users) | Identifiant utilisateur |
| `household_size` | int | Nombre de personnes dans le foyer |
| `preferred_stores` | text[] | Magasins habituels sélectionnés à l'onboarding |
| `onboarding_completed` | bool | Onboarding terminé |
| `created_at` | timestamptz | |

### À venir

- `recipes` — recettes créées ou sauvegardées par l'utilisateur
- `meal_plans` — planification hebdomadaire (semaine + repas par jour)
- `shopping_lists` — listes de courses générées
- `shopping_items` — items dans une liste
- `pantry_items` — inventaire du garde-manger

## Conventions SQL

- Nommage : `snake_case`
- Clés primaires : `uuid` générées par Supabase
- RLS (Row Level Security) activé sur toutes les tables
- Triggers Supabase pour la création automatique du profil à l'inscription
