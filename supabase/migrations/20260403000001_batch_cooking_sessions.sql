CREATE TABLE batch_cooking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id),
  week_start DATE NOT NULL,
  recipe_ids TEXT[] NOT NULL,
  session_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE batch_cooking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_sessions" ON batch_cooking_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "household_read_sessions" ON batch_cooking_sessions
  FOR SELECT USING (
    household_id IS NOT NULL AND
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );
