"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getHousehold } from "./getHousehold";
import type { Household } from "@/applications/user/domain/entities/household";

export async function joinHousehold(code: string): Promise<Household | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase.rpc("join_household_by_code", {
    p_invite_code: code.trim().toUpperCase(),
  });

  if (error) {
    if (error.message.includes("Already in a household")) return { error: "Tu es déjà dans un foyer" };
    if (error.message.includes("Invalid invite code")) return { error: "Code invalide" };
    return { error: error.message };
  }

  if (!data) return { error: "Erreur inconnue" };

  revalidatePath("/profile");
  revalidatePath("/shopping");

  const household = await getHousehold();
  return household ?? { error: "Erreur lors du chargement du foyer" };
}
