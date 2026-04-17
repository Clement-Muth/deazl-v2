ALTER TABLE public.shopping_lists
  ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS store_id     UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

ALTER TABLE public.shopping_items
  ADD COLUMN IF NOT EXISTS price_paid DECIMAL(10,2);
