import { supabase } from "../../../../lib/supabase";
import { categorizeItem } from "../../../shopping/domain/categorizeItem";
import { getRecipeById } from "./getRecipeById";

export async function addRecipeToShoppingList(
  recipeId: string,
  servings?: number
): Promise<{ count?: number; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const recipe = await getRecipeById(recipeId);
  if (!recipe) return { error: "Recipe not found" };

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const listQuery = supabase
    .from("shopping_lists")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  if (membership?.household_id) {
    listQuery.eq("household_id", membership.household_id);
  } else {
    listQuery.eq("user_id", user.id);
  }

  let { data: list } = await listQuery.maybeSingle();

  if (!list) {
    const insertData = membership?.household_id
      ? { household_id: membership.household_id, status: "active" }
      : { user_id: user.id, status: "active" };

    const { data: newList, error } = await supabase
      .from("shopping_lists")
      .insert(insertData)
      .select("id")
      .single();

    if (error || !newList) return { error: error?.message ?? "Failed to create shopping list" };
    list = newList;
  }

  const listId = list.id;

  const { data: lastItem } = await supabase
    .from("shopping_items")
    .select("sort_order")
    .eq("shopping_list_id", listId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextSortOrder = (lastItem?.sort_order ?? -1) + 1;

  const multiplier = servings && recipe.servings > 0 ? servings / recipe.servings : 1;

  const items = recipe.ingredients
    .filter((ing) => (ing.customName ?? ing.productName ?? "").trim().length > 0)
    .map((ing) => {
      const name = ing.productName ?? ing.customName ?? "";
      const scaledQty = ing.quantity * multiplier;
      return {
        shopping_list_id: listId,
        custom_name: name.trim(),
        quantity: scaledQty === Math.floor(scaledQty) ? scaledQty : parseFloat(scaledQty.toFixed(2)),
        unit: ing.unit || "pièce",
        is_checked: false,
        sort_order: nextSortOrder++,
        category: categorizeItem(name),
        product_id: ing.productId ?? null,
        recipe_id: recipeId,
        recipe_name: recipe.name,
      };
    });

  if (items.length === 0) return { count: 0 };

  const { error } = await supabase.from("shopping_items").insert(items);
  if (error) return { error: error.message };

  return { count: items.length };
}
