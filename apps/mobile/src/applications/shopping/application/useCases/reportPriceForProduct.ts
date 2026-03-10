import { supabase } from "../../../../lib/supabase";

export async function reportPriceForProduct(
  productId: string,
  storeId: string,
  price: number,
  quantity: number,
  unit: string,
): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const { error } = await supabase.from("prices").insert({
    product_id: productId,
    store_id: storeId,
    price,
    quantity,
    unit,
    reported_by: user.id,
  });

  if (error) return { error: error.message };
  return {};
}
