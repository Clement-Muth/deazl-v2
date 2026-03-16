ALTER TABLE meal_slots ADD COLUMN IF NOT EXISTS is_done boolean NOT NULL DEFAULT false;
