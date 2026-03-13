# Modèle de données

Toutes les tables sont en PostgreSQL (Supabase). Row Level Security (RLS) activée partout.

## Conventions

- **PKs** : `uuid` généré côté Supabase (`gen_random_uuid()`)
- **Nommage** : snake_case
- **Timestamps** : `created_at` systématiquement, `updated_at` si besoin
- **RLS** : chaque table a une policy qui restreint l'accès à l'utilisateur propriétaire (via `auth.uid()`)

## Tables principales

### `profiles`
Extension de `auth.users`. Créée automatiquement à l'inscription via trigger.

```sql
profiles (
  id          uuid references auth.users primary key,
  household_size      int default 1,
  preferred_stores    text[],
  onboarding_completed boolean default false,
  created_at  timestamptz default now()
)
```

### `recipes`
```sql
recipes (
  id          uuid primary key,
  user_id     uuid references profiles,
  title       text,
  description text,
  servings    int,
  prep_time   int,   -- minutes
  cook_time   int,   -- minutes
  is_public   boolean default false,
  created_at  timestamptz
)
```

### `recipe_ingredients`
```sql
recipe_ingredients (
  id          uuid primary key,
  recipe_id   uuid references recipes,
  name        text,
  quantity    numeric,
  unit        text,
  off_id      text   -- Open Food Facts barcode (optionnel)
)
```

### `meal_plans`
```sql
meal_plans (
  id          uuid primary key,
  user_id     uuid references profiles,
  week_start  date,
  created_at  timestamptz
)
```

### `meal_plan_items`
```sql
meal_plan_items (
  id           uuid primary key,
  meal_plan_id uuid references meal_plans,
  recipe_id    uuid references recipes,
  day          int,         -- 0 = lundi, 6 = dimanche
  meal_type    text         -- 'breakfast' | 'lunch' | 'dinner'
)
```

### `shopping_items`
```sql
shopping_items (
  id           uuid primary key,
  user_id      uuid references profiles,
  name         text,
  quantity     numeric,
  unit         text,
  category     text,
  checked      boolean default false,
  price        numeric,
  store        text,
  week_start   date,
  created_at   timestamptz
)
```

### `pantry_items`
```sql
pantry_items (
  id          uuid primary key,
  user_id     uuid references profiles,
  name        text,
  quantity    numeric,
  unit        text,
  created_at  timestamptz
)
```

## Migrations

Toutes les migrations sont dans `supabase/migrations/` avec le préfixe timestamp YYYYMMDDHHMMSS. Ne jamais modifier une migration existante — créer une nouvelle.

```bash
# Appliquer les migrations en local
supabase db push

# Appliquer sur un projet Supabase distant
supabase db push --project-ref <project-ref>
```
