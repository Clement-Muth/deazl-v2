ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS fridge_days        INT,
  ADD COLUMN IF NOT EXISTS freezer_months     INT,
  ADD COLUMN IF NOT EXISTS is_curated         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS batch_cooking_tags TEXT[]  NOT NULL DEFAULT '{}';
