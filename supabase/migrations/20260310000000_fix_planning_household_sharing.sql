drop policy "meal_plans_access" on public.meal_plans;

create policy "meal_plans_access" on public.meal_plans
  using (
    user_id = auth.uid()
    or (household_id is not null and household_id = my_household_id())
    or user_id in (
      select hm2.user_id
      from public.household_members hm1
      join public.household_members hm2 on hm1.household_id = hm2.household_id
      where hm1.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    or (household_id is not null and household_id = my_household_id())
  );

drop policy "meal_slots_access" on public.meal_slots;

create policy "meal_slots_access" on public.meal_slots
  using (
    exists (
      select 1 from public.meal_plans mp
      where mp.id = meal_plan_id
      and (
        mp.user_id = auth.uid()
        or (mp.household_id is not null and mp.household_id = my_household_id())
        or mp.user_id in (
          select hm2.user_id
          from public.household_members hm1
          join public.household_members hm2 on hm1.household_id = hm2.household_id
          where hm1.user_id = auth.uid()
        )
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
