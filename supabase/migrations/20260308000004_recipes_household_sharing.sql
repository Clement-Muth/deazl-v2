-- Allow household members to read each other's recipes

drop policy "Users read own recipes or public" on public.recipes;

create policy "Users read own recipes or public or household" on public.recipes
  for select using (
    auth.uid() = user_id
    or is_public = true
    or user_id in (
      select hm2.user_id
      from public.household_members hm1
      join public.household_members hm2 on hm1.household_id = hm2.household_id
      where hm1.user_id = auth.uid()
        and hm2.user_id <> auth.uid()
    )
  );

drop policy "Recipe ingredients follow recipe access" on public.recipe_ingredients;

create policy "Recipe ingredients follow recipe access" on public.recipe_ingredients
  for select using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and (
          r.user_id = auth.uid()
          or r.is_public = true
          or r.user_id in (
            select hm2.user_id
            from public.household_members hm1
            join public.household_members hm2 on hm1.household_id = hm2.household_id
            where hm1.user_id = auth.uid()
              and hm2.user_id <> auth.uid()
          )
        )
    )
  );

drop policy "Recipe steps follow recipe access" on public.recipe_steps;

create policy "Recipe steps follow recipe access" on public.recipe_steps
  for select using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and (
          r.user_id = auth.uid()
          or r.is_public = true
          or r.user_id in (
            select hm2.user_id
            from public.household_members hm1
            join public.household_members hm2 on hm1.household_id = hm2.household_id
            where hm1.user_id = auth.uid()
              and hm2.user_id <> auth.uid()
          )
        )
    )
  );
