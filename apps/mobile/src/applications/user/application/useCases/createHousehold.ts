import { supabase } from "../../../../lib/supabase";
import type { Household } from "./getHousehold";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}

export async function createHousehold(): Promise<Household | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.household_id) return { error: "Déjà dans un foyer" };

  let household = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    const { data, error } = await supabase
      .from("households")
      .insert({ invite_code: code, created_by: user.id })
      .select("id, invite_code, created_by")
      .single();
    if (!error && data) { household = data; break; }
    if (error?.code !== "23505") return { error: error?.message ?? "Erreur" };
  }

  if (!household) return { error: "Code non généré, réessayez" };

  await supabase.from("household_members").insert({ household_id: household.id, user_id: user.id });

  return {
    id: household.id,
    inviteCode: household.invite_code,
    createdBy: household.created_by,
    members: [{
      userId: user.id,
      displayName: user.user_metadata?.full_name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    }],
  };
}
