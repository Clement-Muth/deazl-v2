-- Fix : INSERT ... .select() sur households déclenche aussi la politique
-- SELECT. Au moment du RETURNING, l'utilisateur n'est pas encore dans
-- household_members donc my_household_id() = NULL et le SELECT échoue,
-- ce qui annule l'INSERT entier.
-- Solution : autoriser le créateur à lire sa propre ligne.

drop policy if exists "households_select_members" on public.households;

create policy "households_select_members" on public.households
  for select using (
    id = my_household_id()
    or created_by = auth.uid()
  );
