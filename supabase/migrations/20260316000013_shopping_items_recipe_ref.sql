ALTER TABLE shopping_items
  ADD COLUMN IF NOT EXISTS recipe_id   uuid REFERENCES recipes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipe_name text;
