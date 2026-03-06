alter table public.meal_plans
  add column household_id uuid references public.households(id) on delete set null;

create unique index meal_plans_household_week_idx
  on public.meal_plans(household_id, week_start)
  where household_id is not null;

drop policy if exists "Users manage own meal plans" on public.meal_plans;

create policy "meal_plans_access" on public.meal_plans
  using (
    user_id = auth.uid()
    or (household_id is not null and household_id = my_household_id())
  )
  with check (
    user_id = auth.uid()
    or (household_id is not null and household_id = my_household_id())
  );

drop policy if exists "Meal slots follow plan access" on public.meal_slots;

create policy "meal_slots_access" on public.meal_slots
  using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id
      and (
        mp.user_id = auth.uid()
        or (mp.household_id is not null and mp.household_id = my_household_id())
      )
    )
  )
  with check (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id
      and (
        mp.user_id = auth.uid()
        or (mp.household_id is not null and mp.household_id = my_household_id())
      )
    )
  );

alter table public.meal_slots replica identity full;
alter publication supabase_realtime add table meal_slots;
