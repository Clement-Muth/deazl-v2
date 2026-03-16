ALTER TABLE products
  ADD COLUMN IF NOT EXISTS saturated_fat_100g numeric,
  ADD COLUMN IF NOT EXISTS sugars_100g        numeric;
