import { createClient } from "@/lib/supabase/server";
import type { Household, HouseholdMember } from "@/applications/user/domain/entities/household";

export async function getHousehold(): Promise<Household | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.household_id) return null;

  const [{ data: household }, { data: members }] = await Promise.all([
    supabase
      .from("households")
      .select("id, invite_code, created_by")
      .eq("id", membership.household_id)
      .single(),
    supabase
      .from("household_members")
      .select("user_id, joined_at, profiles(display_name, avatar_url)")
      .eq("household_id", membership.household_id),
  ]);

  if (!household) return null;

  const mappedMembers: HouseholdMember[] = (members ?? []).map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      userId: m.user_id,
      displayName: (profile as { display_name: string | null } | null)?.display_name ?? null,
      avatarUrl: (profile as { avatar_url: string | null } | null)?.avatar_url ?? null,
      joinedAt: new Date(m.joined_at),
    };
  });

  return {
    id: household.id,
    inviteCode: household.invite_code,
    createdBy: household.created_by,
    members: mappedMembers,
  };
}
