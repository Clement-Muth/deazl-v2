import { supabase } from "../../../../lib/supabase";

interface CheckoutPayload {
  storeId?: string;
  total?: number;
  itemPrices?: { itemId: string; pricePaid: number }[];
}

export async function completeShoppingList(listId: string, payload?: CheckoutPayload): Promise<void> {
  await supabase.from("shopping_lists").update({
    status: "completed",
    purchased_at: new Date().toISOString(),
    store_id: payload?.storeId ?? null,
    total_amount: payload?.total ?? null,
  }).eq("id", listId);

  if (payload?.itemPrices && payload.itemPrices.length > 0) {
    await Promise.all(
      payload.itemPrices.map(({ itemId, pricePaid }) =>
        supabase.from("shopping_items").update({ price_paid: pricePaid }).eq("id", itemId)
      )
    );
  }
}
