-- ============================================================
-- Households — partage de liste de courses entre membres
-- ============================================================

-- Table foyer
create table public.households (
  id          uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Membres du foyer
create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- Rattacher une liste de courses à un foyer (nullable pour compatibilité)
alter table public.shopping_lists
  add column household_id uuid references public.households(id) on delete set null;

-- ============================================================
-- RLS — households
-- ============================================================

alter table public.households enable row level security;

create policy "households_select_members" on public.households
  for select using (
    id in (select household_id from public.household_members where user_id = auth.uid())
  );

create policy "households_insert" on public.households
  for insert with check (auth.uid() = created_by);

create policy "households_update_creator" on public.households
  for update using (auth.uid() = created_by);

create policy "households_delete_creator" on public.households
  for delete using (auth.uid() = created_by);

-- ============================================================
-- RLS — household_members
-- ============================================================

alter table public.household_members enable row level security;

create policy "household_members_select" on public.household_members
  for select using (
    household_id in (
      select household_id from public.household_members hm where hm.user_id = auth.uid()
    )
  );

create policy "household_members_insert" on public.household_members
  for insert with check (auth.uid() = user_id);

create policy "household_members_delete_self" on public.household_members
  for delete using (auth.uid() = user_id);

-- ============================================================
-- RLS — shopping_lists : mise à jour pour les listes partagées
-- ============================================================

drop policy "Users manage own shopping lists" on public.shopping_lists;

create policy "shopping_lists_access" on public.shopping_lists
  using (
    auth.uid() = user_id
    or (
      household_id is not null
      and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      )
    )
  )
  with check (
    auth.uid() = user_id
    or (
      household_id is not null
      and household_id in (
        select household_id from public.household_members where user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- RLS — shopping_items : mise à jour pour les listes partagées
-- ============================================================

drop policy "Shopping items follow list access" on public.shopping_items;

create policy "shopping_items_access" on public.shopping_items
  using (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_id
      and (
        sl.user_id = auth.uid()
        or (
          sl.household_id is not null
          and sl.household_id in (
            select household_id from public.household_members where user_id = auth.uid()
          )
        )
      )
    )
  );

-- ============================================================
-- Realtime — activer pour shopping_items
-- ============================================================

alter table public.shopping_items replica identity full;

alter publication supabase_realtime add table public.shopping_items;

-- ============================================================
-- Fonction sécurisée : rejoindre un foyer par code
-- (security definer pour lire households sans être membre)
-- ============================================================

create or replace function public.join_household_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_user_id      uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from household_members where user_id = v_user_id) then
    raise exception 'Already in a household';
  end if;

  select id into v_household_id
  from households
  where invite_code = upper(trim(p_invite_code));

  if v_household_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into household_members (household_id, user_id)
  values (v_household_id, v_user_id);

  return v_household_id;
end;
$$;
