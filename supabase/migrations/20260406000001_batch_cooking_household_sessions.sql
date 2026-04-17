-- Batch cooking sessions partagées par foyer
-- Chaque foyer a une seule session par semaine (au lieu d'une par user)
-- Sans foyer : une session par user par semaine (comportement inchangé)

ALTER TABLE batch_cooking_sessions DROP CONSTRAINT IF EXISTS batch_cooking_sessions_user_id_week_start_key;

CREATE UNIQUE INDEX IF NOT EXISTS batch_cooking_sessions_household_week_unique
  ON batch_cooking_sessions (household_id, week_start)
  WHERE household_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS batch_cooking_sessions_user_week_unique
  ON batch_cooking_sessions (user_id, week_start)
  WHERE household_id IS NULL;

DROP POLICY IF EXISTS "household_read_sessions" ON batch_cooking_sessions;

CREATE POLICY "household_all_sessions" ON batch_cooking_sessions
  FOR ALL USING (
    household_id IS NOT NULL AND
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );
