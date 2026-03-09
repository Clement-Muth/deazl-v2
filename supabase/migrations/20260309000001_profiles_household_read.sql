drop policy if exists "Users see their own profile" on public.profiles;

create policy "Users and household members read profiles"
  on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1
      from public.household_members hm1
      join public.household_members hm2 on hm1.household_id = hm2.household_id
      where hm1.user_id = auth.uid()
        and hm2.user_id = profiles.id
    )
  );
