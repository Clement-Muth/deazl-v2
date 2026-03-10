import { supabase } from "../../../../lib/supabase";

export interface HouseholdMember {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface Household {
  id: string;
  inviteCode: string;
  createdBy: string;
  members: HouseholdMember[];
}

export async function getHousehold(): Promise<Household | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.household_id) return null;

  const [{ data: household }, { data: members }] = await Promise.all([
    supabase.from("households").select("id, invite_code, created_by").eq("id", membership.household_id).single(),
    supabase.from("household_members").select("user_id, profiles(display_name, avatar_url)").eq("household_id", membership.household_id),
  ]);

  if (!household) return null;

  return {
    id: household.id,
    inviteCode: household.invite_code,
    createdBy: household.created_by,
    members: (members ?? []).map((m) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return {
        userId: m.user_id,
        displayName: (profile as { display_name: string | null } | null)?.display_name ?? null,
        avatarUrl: (profile as { avatar_url: string | null } | null)?.avatar_url ?? null,
      };
    }),
  };
}
