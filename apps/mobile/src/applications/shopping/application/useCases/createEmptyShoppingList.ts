import { supabase } from "../../../../lib/supabase";

export async function createEmptyShoppingList(): Promise<{ id: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  await supabase
    .from("shopping_lists")
    .update({ status: "archived" })
    .eq("user_id", user.id)
    .eq("status", "active");

  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({
      user_id: user.id,
      household_id: membership?.household_id ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return { id: data.id };
}
