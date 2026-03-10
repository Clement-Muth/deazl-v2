import { supabase } from "../../../../lib/supabase";

export async function transferCheckedToPantry(
  items: Array<{ name: string; quantity: number; unit: string }>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("pantry_items").insert(
    items.map((item) => ({
      user_id: user.id,
      custom_name: item.name,
      quantity: item.quantity || null,
      unit: item.unit || null,
      location: "pantry",
    }))
  );
}
