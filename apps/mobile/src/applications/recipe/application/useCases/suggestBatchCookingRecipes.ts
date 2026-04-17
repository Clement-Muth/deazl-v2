import { supabase } from "../../../../lib/supabase";
import type { BatchCookingTag, Recipe } from "../../domain/entities/recipe";

export interface BatchRecipeSuggestion {
  recipe: Recipe;
  portions: number;
}

export async function suggestBatchCookingRecipes(
  recipeCount: number,
  mealCount: number,
  excludeRecipeIds: string[] = []
): Promise<BatchRecipeSuggestion[]> {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().slice(0, 10);

  const { data: { user } } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from("recipes")
    .select("id, name, image_url, prep_time_minutes, cook_time_minutes, servings, dietary_tags, batch_cooking_tags, fridge_days, freezer_months, is_curated, description, is_public, user_id, created_at, updated_at")
    .eq("is_curated", true)
    .not("id", "in", `(${excludeRecipeIds.length ? excludeRecipeIds.join(",") : "00000000-0000-0000-0000-000000000000"})`);

  let recentIds = new Set<string>();
  if (user) {
    const { data: recentPlans } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("user_id", user.id)
      .gte("week_start", twoWeeksAgoStr);
    if (recentPlans && recentPlans.length > 0) {
      const planIds = recentPlans.map((p: { id: string }) => p.id);
      const { data: recentSlots } = await supabase
        .from("meal_slots")
        .select("recipe_id")
        .in("meal_plan_id", planIds);
      recentIds = new Set((recentSlots ?? []).map((s: { recipe_id: string }) => s.recipe_id));
    }
  }

  if (!rows || rows.length === 0) return [];

  const candidates = rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    imageUrl: row.image_url as string | null,
    prepTimeMinutes: row.prep_time_minutes as number | null,
    cookTimeMinutes: row.cook_time_minutes as number | null,
    servings: row.servings as number,
    dietaryTags: (row.dietary_tags as string[]) ?? [],
    batchCookingTags: (row.batch_cooking_tags as BatchCookingTag[]) ?? [],
    fridgeDays: row.fridge_days as number | null,
    freezerMonths: row.freezer_months as number | null,
    isCurated: true,
    isFavorite: false,
    isPublic: row.is_public as boolean,
    userId: row.user_id as string,
    description: row.description as string | null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    ingredients: [],
    steps: [],
    score: recentIds.has(row.id as string) ? 0 : 1,
  }));

  const usedTags = new Set<string>();
  const selected: typeof candidates = [];

  const sorted = [...candidates].sort((a, b) => b.score - a.score);

  for (const candidate of sorted) {
    if (selected.length >= recipeCount) break;
    const tags = candidate.batchCookingTags;
    const hasNewTag = tags.length === 0 || tags.some((t) => !usedTags.has(t));
    if (hasNewTag || selected.length < recipeCount) {
      selected.push(candidate);
      tags.forEach((t) => usedTags.add(t));
    }
  }

  while (selected.length < recipeCount && sorted.length > selected.length) {
    const next = sorted.find((c) => !selected.includes(c));
    if (!next) break;
    selected.push(next);
  }

  const basePortions = Math.floor(mealCount / recipeCount);
  const remainder = mealCount % recipeCount;

  return selected.map((recipe, i) => ({
    recipe,
    portions: basePortions + (i < remainder ? 1 : 0),
  }));
}
