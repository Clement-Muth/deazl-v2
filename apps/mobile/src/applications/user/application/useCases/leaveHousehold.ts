import { supabase } from "../../../../lib/supabase";

export async function leaveHousehold(): Promise<{ error: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.household_id) return null;

  const householdId = membership.household_id;

  await supabase
    .from("household_members")
    .delete()
    .eq("user_id", user.id)
    .eq("household_id", householdId);

  const { count } = await supabase
    .from("household_members")
    .select("user_id", { count: "exact", head: true })
    .eq("household_id", householdId);

  if (count === 0) {
    await supabase.from("households").delete().eq("id", householdId);
  }

  return null;
}
