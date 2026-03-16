ALTER TABLE products
  ADD COLUMN IF NOT EXISTS allergens_tags  text[],
  ADD COLUMN IF NOT EXISTS additives_tags  text[];
