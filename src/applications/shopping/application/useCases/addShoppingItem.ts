"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type AddItemState = { error: string } | undefined;

export async function addShoppingItem(
  listId: string,
  _prevState: AddItemState,
  formData: FormData
): Promise<AddItemState> {
  const name = (formData.get("name") as string)?.trim();
  const quantity = parseFloat(formData.get("quantity") as string) || 1;
  const unit = (formData.get("unit") as string)?.trim() || "pièce";

  if (!name) return { error: "Name is required" };

  const supabase = await createClient();

  const { data: lastItem } = await supabase
    .from("shopping_items")
    .select("sort_order")
    .eq("shopping_list_id", listId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const sortOrder = (lastItem?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("shopping_items").insert({
    shopping_list_id: listId,
    custom_name: name,
    quantity,
    unit,
    is_checked: false,
    sort_order: sortOrder,
  });

  if (error) return { error: error.message };

  revalidatePath("/shopping");
}
