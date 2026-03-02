-- ============================================================
-- Deazl v2 — Initial Schema
-- ============================================================
-- Bounded Contexts: user | catalog | recipe | planning | shopping | pantry
-- Analytics: vues et fonctions PostgreSQL (pas de tables dédiées)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "unaccent";

-- ============================================================
-- BC: USER
-- ============================================================

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger: création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- BC: CATALOG — Magasins
-- ============================================================

create table public.stores (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  brand       text,                   -- Carrefour, Leclerc, Lidl, etc.
  address     text,
  city        text,
  postal_code text,
  latitude    decimal(10, 7),
  longitude   decimal(10, 7),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Magasins favoris d'un utilisateur
create table public.user_stores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  store_id    uuid not null references public.stores(id) on delete cascade,
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now(),
  unique(user_id, store_id)
);

-- ============================================================
-- BC: CATALOG — Produits
-- ============================================================

create table public.products (
  id              uuid primary key default gen_random_uuid(),
  -- Open Food Facts
  off_id          text unique,              -- barcode EAN/UPC (null si produit custom)
  name            text not null,
  brand           text,
  category        text,
  image_url       text,
  -- Qualité nutritionnelle (source: Open Food Facts)
  nutriscore_grade text,                   -- a, b, c, d, e
  ecoscore_grade  text,                    -- a, b, c, d, e
  nova_group      smallint check (nova_group between 1 and 4),
  labels          text[] default '{}',     -- bio, label-rouge, aop, aoc, igp, etc.
  -- Unité de référence pour les prix
  unit            text not null default 'pièce', -- g, ml, kg, L, pièce
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index products_off_id_idx on public.products(off_id);
create index products_name_idx on public.products using gin(to_tsvector('french', name));

-- ============================================================
-- BC: CATALOG — Prix
-- ============================================================

create table public.prices (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  store_id        uuid not null references public.stores(id) on delete cascade,
  price           decimal(10, 2) not null check (price >= 0),
  quantity        decimal(10, 3) not null default 1, -- quantité pour ce prix
  unit            text not null,                     -- unité de la quantité
  price_per_kg    decimal(10, 2),                    -- calculé (null si non applicable)
  reported_by     uuid references public.profiles(id) on delete set null,
  reported_at     timestamptz not null default now(),
  is_verified     boolean not null default false
);

-- Index pour la requête "quel est le prix de ce produit dans ce magasin ?"
create index prices_product_store_idx on public.prices(product_id, store_id);
-- Index pour garder le prix le plus récent
create index prices_reported_at_idx on public.prices(product_id, store_id, reported_at desc);

-- ============================================================
-- BC: RECIPE
-- ============================================================

create table public.recipes (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  name                text not null,
  description         text,
  servings            int not null default 4 check (servings > 0),
  prep_time_minutes   int,
  cook_time_minutes   int,
  image_url           text,
  is_public           boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.recipe_ingredients (
  id              uuid primary key default gen_random_uuid(),
  recipe_id       uuid not null references public.recipes(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  custom_name     text,                  -- si produit pas dans la base
  quantity        decimal(10, 3) not null check (quantity > 0),
  unit            text not null,
  is_optional     boolean not null default false,
  sort_order      int not null default 0,
  constraint ingredient_has_name check (product_id is not null or custom_name is not null)
);

create index recipe_ingredients_recipe_idx on public.recipe_ingredients(recipe_id);

create table public.recipe_steps (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references public.recipes(id) on delete cascade,
  step_number int not null,
  description text not null,
  unique(recipe_id, step_number)
);

-- ============================================================
-- BC: PLANNING
-- ============================================================

create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');

create table public.meal_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  week_start  date not null,  -- Lundi de la semaine (format: YYYY-MM-DD)
  created_at  timestamptz not null default now(),
  unique(user_id, week_start)
);

create table public.meal_slots (
  id            uuid primary key default gen_random_uuid(),
  meal_plan_id  uuid not null references public.meal_plans(id) on delete cascade,
  day_of_week   smallint not null check (day_of_week between 1 and 7), -- 1=Lundi, 7=Dimanche
  meal_type     meal_type not null,
  recipe_id     uuid references public.recipes(id) on delete set null,
  servings      int not null default 4 check (servings > 0),
  notes         text,
  unique(meal_plan_id, day_of_week, meal_type)
);

create index meal_slots_plan_idx on public.meal_slots(meal_plan_id, day_of_week);

-- ============================================================
-- BC: SHOPPING
-- ============================================================

create type public.shopping_list_status as enum ('active', 'completed', 'archived');

create table public.shopping_lists (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  meal_plan_id  uuid references public.meal_plans(id) on delete set null,
  name          text,
  status        shopping_list_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.shopping_items (
  id                    uuid primary key default gen_random_uuid(),
  shopping_list_id      uuid not null references public.shopping_lists(id) on delete cascade,
  product_id            uuid references public.products(id) on delete set null,
  custom_name           text,
  quantity              decimal(10, 3) not null check (quantity > 0),
  unit                  text not null,
  is_checked            boolean not null default false,
  chosen_store_id       uuid references public.stores(id) on delete set null,
  chosen_price_id       uuid references public.prices(id) on delete set null,
  recipe_ingredient_id  uuid references public.recipe_ingredients(id) on delete set null,
  sort_order            int not null default 0,
  constraint item_has_name check (product_id is not null or custom_name is not null)
);

create index shopping_items_list_idx on public.shopping_items(shopping_list_id, is_checked);

-- ============================================================
-- BC: PANTRY
-- ============================================================

create type public.storage_location as enum ('fridge', 'freezer', 'pantry', 'other');

create table public.pantry_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  custom_name text,
  quantity    decimal(10, 3),
  unit        text,
  expiry_date date,
  location    storage_location not null default 'pantry',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint pantry_item_has_name check (product_id is not null or custom_name is not null)
);

create index pantry_expiry_idx on public.pantry_items(user_id, expiry_date asc nulls last);

-- ============================================================
-- ANALYTICS — Vues
-- ============================================================

-- Prix le plus récent par produit et magasin
create view public.latest_prices as
select distinct on (product_id, store_id)
  p.*,
  s.name as store_name,
  s.brand as store_brand,
  s.city as store_city
from public.prices p
join public.stores s on s.id = p.store_id
order by product_id, store_id, reported_at desc;

-- Prix min/max par produit (tous magasins confondus)
create view public.product_price_range as
select
  product_id,
  min(price)          as min_price,
  max(price)          as max_price,
  avg(price)::decimal(10,2) as avg_price,
  count(distinct store_id) as store_count
from public.latest_prices
group by product_id;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles
alter table public.profiles enable row level security;
create policy "Users see their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update their own profile" on public.profiles for update using (auth.uid() = id);

-- Stores (partagés, lecture pour tous les authentifiés)
alter table public.stores enable row level security;
create policy "Authenticated users read stores" on public.stores for select to authenticated using (true);
create policy "Authenticated users create stores" on public.stores for insert to authenticated with check (auth.uid() = created_by);

-- User stores
alter table public.user_stores enable row level security;
create policy "Users manage their own store list" on public.user_stores using (auth.uid() = user_id);

-- Products (partagés)
alter table public.products enable row level security;
create policy "Authenticated users read products" on public.products for select to authenticated using (true);
create policy "Authenticated users create products" on public.products for insert to authenticated with check (true);

-- Prices (partagés)
alter table public.prices enable row level security;
create policy "Authenticated users read prices" on public.prices for select to authenticated using (true);
create policy "Authenticated users report prices" on public.prices for insert to authenticated with check (auth.uid() = reported_by);

-- Recipes
alter table public.recipes enable row level security;
create policy "Users read own recipes or public" on public.recipes for select using (auth.uid() = user_id or is_public = true);
create policy "Users manage own recipes" on public.recipes for all using (auth.uid() = user_id);

alter table public.recipe_ingredients enable row level security;
create policy "Recipe ingredients follow recipe access" on public.recipe_ingredients for select
  using (exists (select 1 from public.recipes r where r.id = recipe_id and (r.user_id = auth.uid() or r.is_public = true)));
create policy "Users manage own recipe ingredients" on public.recipe_ingredients for all
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));

alter table public.recipe_steps enable row level security;
create policy "Recipe steps follow recipe access" on public.recipe_steps for select
  using (exists (select 1 from public.recipes r where r.id = recipe_id and (r.user_id = auth.uid() or r.is_public = true)));
create policy "Users manage own recipe steps" on public.recipe_steps for all
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));

-- Meal plans
alter table public.meal_plans enable row level security;
create policy "Users manage own meal plans" on public.meal_plans using (auth.uid() = user_id);

alter table public.meal_slots enable row level security;
create policy "Meal slots follow plan access" on public.meal_slots using (
  exists (select 1 from public.meal_plans mp where mp.id = meal_plan_id and mp.user_id = auth.uid())
);

-- Shopping
alter table public.shopping_lists enable row level security;
create policy "Users manage own shopping lists" on public.shopping_lists using (auth.uid() = user_id);

alter table public.shopping_items enable row level security;
create policy "Shopping items follow list access" on public.shopping_items using (
  exists (select 1 from public.shopping_lists sl where sl.id = shopping_list_id and sl.user_id = auth.uid())
);

-- Pantry
alter table public.pantry_items enable row level security;
create policy "Users manage own pantry" on public.pantry_items using (auth.uid() = user_id);
