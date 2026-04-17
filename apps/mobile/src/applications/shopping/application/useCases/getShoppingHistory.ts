import { supabase } from "../../../../lib/supabase";

export interface ShoppingReceipt {
  id: string;
  name: string | null;
  purchasedAt: string | null;
  storeId: string | null;
  storeName: string | null;
  storeCity: string | null;
  totalAmount: number | null;
  itemCount: number;
  checkedCount: number;
}

export interface ReceiptItem {
  id: string;
  customName: string;
  quantity: number;
  unit: string;
  pricePaid: number | null;
  isChecked: boolean;
}

export async function getShoppingHistory(): Promise<ShoppingReceipt[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const query = supabase
    .from("shopping_lists")
    .select("id, name, purchased_at, updated_at, total_amount, stores(id, name, city), shopping_items(id, is_checked)")
    .eq("status", "completed")
    .order("purchased_at", { ascending: false, nullsFirst: false })
    .limit(50);

  if (membership?.household_id) {
    query.eq("household_id", membership.household_id);
  } else {
    query.eq("user_id", user.id);
  }

  const { data } = await query;

  return (data ?? []).map((row) => {
    const store = Array.isArray(row.stores) ? row.stores[0] : row.stores;
    const items = row.shopping_items ?? [];
    return {
      id: row.id,
      name: row.name ?? null,
      purchasedAt: row.purchased_at ?? row.updated_at ?? null,
      storeId: store?.id ?? null,
      storeName: store?.name ?? null,
      storeCity: store?.city ?? null,
      totalAmount: row.total_amount ?? null,
      itemCount: items.length,
      checkedCount: items.filter((i: { is_checked: boolean }) => i.is_checked).length,
    };
  });
}

export async function getShoppingReceiptDetail(listId: string): Promise<ReceiptItem[]> {
  const { data } = await supabase
    .from("shopping_items")
    .select("id, custom_name, quantity, unit, price_paid, is_checked, sort_order")
    .eq("shopping_list_id", listId)
    .order("sort_order", { ascending: true });

  const items = (data ?? []).map((row) => ({
    id: row.id,
    customName: row.custom_name ?? "",
    quantity: row.quantity,
    unit: row.unit,
    pricePaid: row.price_paid ?? null,
    isChecked: row.is_checked,
  }));

  return [
    ...items.filter((i) => i.isChecked),
    ...items.filter((i) => !i.isChecked),
  ];
}
