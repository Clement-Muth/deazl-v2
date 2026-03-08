create policy "Authenticated users update products"
  on public.products for update
  to authenticated
  using (true)
  with check (true);
