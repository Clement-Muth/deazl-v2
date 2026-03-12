import { supabase } from "../../../../lib/supabase";

export async function transferCheckedToPantry(
  items: Array<{ name: string | null; quantity: number; unit: string; productId?: string | null }>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const rows = items
    .filter((item) => item.name || item.productId)
    .map((item) => ({
      user_id: user.id,
      custom_name: item.name || null,
      product_id: item.productId || null,
      quantity: item.quantity || null,
      unit: item.unit || null,
      location: "pantry",
    }));

  if (rows.length === 0) return;
  await supabase.from("pantry_items").insert(rows);
}
