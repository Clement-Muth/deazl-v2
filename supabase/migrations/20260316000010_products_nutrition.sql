ALTER TABLE products
  ADD COLUMN IF NOT EXISTS energy_kcal_100g  numeric,
  ADD COLUMN IF NOT EXISTS proteins_100g     numeric,
  ADD COLUMN IF NOT EXISTS carbohydrates_100g numeric,
  ADD COLUMN IF NOT EXISTS fat_100g          numeric,
  ADD COLUMN IF NOT EXISTS fiber_100g        numeric,
  ADD COLUMN IF NOT EXISTS salt_100g         numeric,
  ADD COLUMN IF NOT EXISTS serving_quantity  numeric;
