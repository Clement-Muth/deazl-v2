import { supabase } from "../../../../lib/supabase";
import { fetchRecipesByIds } from "../../infrastructure/supabaseRecipeRepository";
import type { CookingSession } from "../types/cookingSession";

function getMondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export interface PreviousSession {
  id: string;
  weekStart: string;
  recipeIds: string[];
  recipeNames: string[];
  recipeImages: (string | null)[];
  totalMinutes: number | null;
}

export async function getPreviousSessions(limit = 20): Promise<PreviousSession[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const week_start = getMondayOf(new Date());

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let query = supabase
    .from("batch_cooking_sessions")
    .select("id, week_start, recipe_ids, session_data")
    .lt("week_start", week_start)
    .order("week_start", { ascending: false })
    .limit(limit);

  if (membership?.household_id) {
    query = query.eq("household_id", membership.household_id);
  } else {
    query = query.eq("user_id", user.id).is("household_id", null);
  }

  const { data } = await query;

  if (!data || data.length === 0) return [];

  const allIds = [...new Set(data.flatMap((s) => s.recipe_ids as string[]))];
  const recipes = allIds.length > 0 ? await fetchRecipesByIds(allIds) : [];
  const imageMap = Object.fromEntries(recipes.map((r) => [r.id, r.imageUrl ?? null]));
  const nameMap = Object.fromEntries(recipes.map((r) => [r.id, r.name]));

  return data.map((s) => {
    const session = s.session_data as CookingSession;
    const recipeIds = s.recipe_ids as string[];
    const recipeNames = recipeIds.map((id) =>
      nameMap[id] ?? session.conservation?.find((c) => c.recipe_name)?.recipe_name ?? "Recette"
    );
    const recipeImages = recipeIds.map((id) => imageMap[id] ?? null);
    return {
      id: s.id,
      weekStart: s.week_start,
      recipeIds,
      recipeNames,
      recipeImages,
      totalMinutes: session.total_minutes ?? null,
    };
  });
}
