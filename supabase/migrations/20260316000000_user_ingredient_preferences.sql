create table public.user_ingredient_preferences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  ingredient_name text not null,
  product_id      uuid not null references public.products(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, ingredient_name)
);

create index on public.user_ingredient_preferences(user_id, ingredient_name);

alter table public.user_ingredient_preferences enable row level security;

create policy "Users manage own ingredient preferences"
  on public.user_ingredient_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
