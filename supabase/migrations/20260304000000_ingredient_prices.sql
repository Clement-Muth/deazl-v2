create table public.ingredient_prices (
  id            uuid primary key default gen_random_uuid(),
  ingredient_name text not null,
  store_id      uuid not null references public.stores(id) on delete cascade,
  price         decimal(10, 2) not null check (price >= 0),
  quantity      decimal(10, 3) not null default 1,
  unit          text not null,
  reported_by   uuid references public.profiles(id) on delete set null,
  reported_at   timestamptz not null default now()
);

create index ingredient_prices_name_store_idx
  on public.ingredient_prices(ingredient_name, store_id);

create index ingredient_prices_reported_at_idx
  on public.ingredient_prices(ingredient_name, store_id, reported_at desc);

create view public.latest_ingredient_prices as
select distinct on (ingredient_name, store_id)
  p.*,
  s.name  as store_name,
  s.brand as store_brand,
  s.city  as store_city
from public.ingredient_prices p
join public.stores s on s.id = p.store_id
order by ingredient_name, store_id, reported_at desc;

alter table public.ingredient_prices enable row level security;

create policy "Anyone can view ingredient prices"
  on public.ingredient_prices for select
  using (true);

create policy "Authenticated users can insert ingredient prices"
  on public.ingredient_prices for insert
  with check (auth.uid() = reported_by);
