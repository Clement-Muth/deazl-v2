drop policy "Users manage own pantry" on public.pantry_items;

create policy "Users select own or household pantry" on public.pantry_items
  for select using (
    auth.uid() = user_id
    or user_id in (
      select hm2.user_id
      from public.household_members hm1
      join public.household_members hm2 using (household_id)
      where hm1.user_id = auth.uid()
        and hm2.user_id != auth.uid()
    )
  );

create policy "Users insert own pantry" on public.pantry_items
  for insert with check (auth.uid() = user_id);

create policy "Users update own pantry" on public.pantry_items
  for update using (auth.uid() = user_id);

create policy "Users delete own pantry" on public.pantry_items
  for delete using (auth.uid() = user_id);
