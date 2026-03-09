create table public.recipe_favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, recipe_id)
);

alter table public.recipe_favorites enable row level security;

create policy "Users manage their own favorites"
  on public.recipe_favorites
  using (auth.uid() = user_id);

create index recipe_favorites_user_idx on public.recipe_favorites(user_id);
create index recipe_favorites_recipe_idx on public.recipe_favorites(recipe_id);

create policy "Public recipes readable by all"
  on public.recipes for select
  using (is_public = true);

create policy "Public recipe ingredients readable"
  on public.recipe_ingredients for select
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.is_public = true
    )
  );

create policy "Public recipe steps readable"
  on public.recipe_steps for select
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.is_public = true
    )
  );
