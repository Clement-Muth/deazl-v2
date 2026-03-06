-- ============================================================
-- Fix : récursion infinie dans les politiques household_members
-- Solution : fonction SECURITY DEFINER pour récupérer le
-- household_id sans déclencher la RLS sur la même table.
-- ============================================================

-- Fonction stable qui retourne le household_id de l'utilisateur
-- courant en bypassant la RLS (SECURITY DEFINER).
create or replace function public.my_household_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select household_id
  from household_members
  where user_id = auth.uid()
  limit 1
$$;

-- ── household_members ─────────────────────────────────────────
drop policy if exists "household_members_select" on public.household_members;

create policy "household_members_select" on public.household_members
  for select using (
    household_id = my_household_id()
  );

-- ── households ────────────────────────────────────────────────
drop policy if exists "households_select_members" on public.households;

create policy "households_select_members" on public.households
  for select using (
    id = my_household_id()
  );

-- ── shopping_lists ────────────────────────────────────────────
drop policy if exists "shopping_lists_access" on public.shopping_lists;

create policy "shopping_lists_access" on public.shopping_lists
  using (
    auth.uid() = user_id
    or (
      household_id is not null
      and household_id = my_household_id()
    )
  )
  with check (
    auth.uid() = user_id
    or (
      household_id is not null
      and household_id = my_household_id()
    )
  );

-- ── shopping_items ────────────────────────────────────────────
drop policy if exists "shopping_items_access" on public.shopping_items;

create policy "shopping_items_access" on public.shopping_items
  using (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_id
      and (
        sl.user_id = auth.uid()
        or (
          sl.household_id is not null
          and sl.household_id = my_household_id()
        )
      )
    )
  );
