import { supabase } from "../../../../lib/supabase";
import { getHousehold } from "./getHousehold";
import type { Household } from "./getHousehold";

export async function joinHousehold(code: string): Promise<Household | { error: string }> {
  const { data, error } = await supabase.rpc("join_household_by_code", {
    p_invite_code: code.trim().toUpperCase(),
  });

  if (error) {
    if (error.message.includes("Already in a household")) return { error: "Tu es déjà dans un foyer" };
    if (error.message.includes("Invalid invite code")) return { error: "Code invalide" };
    return { error: error.message };
  }

  if (!data) return { error: "Erreur inconnue" };

  const household = await getHousehold();
  return household ?? { error: "Erreur lors du chargement du foyer" };
}
