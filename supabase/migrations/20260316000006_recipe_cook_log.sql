CREATE TABLE recipe_cook_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  cooked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX recipe_cook_log_user_recipe ON recipe_cook_log(user_id, recipe_id);

ALTER TABLE recipe_cook_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cook log"
  ON recipe_cook_log FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
