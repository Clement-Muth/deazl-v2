CREATE TABLE recipe_user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

ALTER TABLE recipe_user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own notes" ON recipe_user_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
