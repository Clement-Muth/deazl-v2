alter table public.shopping_items
  add column if not exists product_id uuid references public.products(id) on delete set null;
