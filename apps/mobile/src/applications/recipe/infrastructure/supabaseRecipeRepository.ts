import { supabase } from "../../../lib/supabase";
import type { BatchCookingTag, Recipe } from "../domain/entities/recipe";

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let visibleUserIds: string[] = [user.id];

  if (membership?.household_id) {
    const { data: members } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", membership.household_id);
    visibleUserIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
  }

  const [{ data, error }, { data: favorites }] = await Promise.all([
    supabase
      .from("recipes")
      .select("*, recipe_ingredients(*, products(id, name)), recipe_steps(*)")
      .in("user_id", visibleUserIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("recipe_favorites")
      .select("recipe_id")
      .eq("user_id", user.id),
  ]);

  if (error || !data) return [];

  const favoriteIds = new Set((favorites ?? []).map((f: { recipe_id: string }) => f.recipe_id));
  const ownRecipeIds = new Set(data.map((r: { id: string }) => r.id));

  const mapRow = (row: Record<string, unknown>, isFav: boolean) => ({
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    description: row.description as string | null,
    servings: row.servings as number,
    prepTimeMinutes: row.prep_time_minutes as number | null,
    cookTimeMinutes: row.cook_time_minutes as number | null,
    imageUrl: row.image_url as string | null,
    dietaryTags: (row.dietary_tags as string[]) ?? [],
    isPublic: row.is_public as boolean,
    isFavorite: isFav,
    isCurated: (row.is_curated as boolean) ?? false,
    fridgeDays: (row.fridge_days as number | null) ?? null,
    freezerMonths: (row.freezer_months as number | null) ?? null,
    batchCookingTags: (row.batch_cooking_tags as BatchCookingTag[]) ?? [],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    ingredients: ((row.recipe_ingredients as Record<string, unknown>[] | undefined) ?? [])
      .sort((a, b) => (a.sort_order as number) - (b.sort_order as number))
      .map((ing) => ({
        id: ing.id as string,
        recipeId: ing.recipe_id as string,
        customName: ing.custom_name as string | null,
        productId: ing.product_id as string | null,
        productName: (ing.products as { id: string; name: string } | null)?.name ?? null,
        quantity: ing.quantity as number,
        unit: ing.unit as string,
        isOptional: ing.is_optional as boolean,
        sortOrder: ing.sort_order as number,
        section: (ing.section as string | null) ?? null,
      })),
    steps: ((row.recipe_steps as Record<string, unknown>[] | undefined) ?? [])
      .sort((a, b) => (a.step_number as number) - (b.step_number as number))
      .map((step) => ({
        id: step.id as string,
        recipeId: step.recipe_id as string,
        stepNumber: step.step_number as number,
        description: step.description as string,
        section: (step.section as string | null) ?? null,
      })),
  });

  const ownRecipes = data.map((row) => mapRow(row, favoriteIds.has(row.id)));

  const curatedFavoriteIds = [...favoriteIds].filter((id) => !ownRecipeIds.has(id));
  let curatedFavorites: Recipe[] = [];
  if (curatedFavoriteIds.length > 0) {
    const { data: curatedData } = await supabase
      .from("recipes")
      .select("id, name, description, image_url, prep_time_minutes, cook_time_minutes, servings, dietary_tags, batch_cooking_tags, fridge_days, freezer_months, is_curated, is_public, user_id, created_at, updated_at")
      .in("id", curatedFavoriteIds)
      .eq("is_curated", true);
    if (curatedData) {
      curatedFavorites = (curatedData as Record<string, unknown>[]).map((row) => ({
        ...mapRow(row, true),
        ingredients: [],
        steps: [],
      }));
    }
  }

  return [...ownRecipes, ...curatedFavorites];
}

export async function fetchCuratedRecipes(): Promise<Recipe[]> {
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data, error }, { data: favorites }] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, name, description, image_url, prep_time_minutes, cook_time_minutes, servings, dietary_tags, batch_cooking_tags, fridge_days, freezer_months, is_curated, is_public, user_id, created_at, updated_at")
      .eq("is_curated", true)
      .order("name", { ascending: true }),
    user
      ? supabase.from("recipe_favorites").select("recipe_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { recipe_id: string }[] }),
  ]);

  if (error || !data) return [];

  const favoriteIds = new Set((favorites ?? []).map((f: { recipe_id: string }) => f.recipe_id));

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    servings: row.servings,
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    imageUrl: row.image_url,
    dietaryTags: row.dietary_tags ?? [],
    isPublic: row.is_public,
    isFavorite: favoriteIds.has(row.id),
    isCurated: true,
    fridgeDays: row.fridge_days ?? null,
    freezerMonths: row.freezer_months ?? null,
    batchCookingTags: row.batch_cooking_tags ?? [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    ingredients: [],
    steps: [],
  }));
}

export async function fetchRecipesByIds(ids: string[]): Promise<Recipe[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("recipes")
    .select("id, name, description, image_url, prep_time_minutes, cook_time_minutes, servings, dietary_tags, batch_cooking_tags, fridge_days, freezer_months, is_curated, is_public, user_id, created_at, updated_at")
    .in("id", ids);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    servings: row.servings,
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    imageUrl: row.image_url,
    dietaryTags: row.dietary_tags ?? [],
    isPublic: row.is_public,
    isFavorite: false,
    isCurated: row.is_curated ?? false,
    fridgeDays: row.fridge_days ?? null,
    freezerMonths: row.freezer_months ?? null,
    batchCookingTags: row.batch_cooking_tags ?? [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    ingredients: [],
    steps: [],
  }));
}

export async function fetchRecipeById(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*, products(id, name)), recipe_steps(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const { data: fav } = await supabase
    .from("recipe_favorites")
    .select("recipe_id")
    .eq("recipe_id", id)
    .maybeSingle();

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    servings: data.servings,
    prepTimeMinutes: data.prep_time_minutes,
    cookTimeMinutes: data.cook_time_minutes,
    imageUrl: data.image_url,
    dietaryTags: data.dietary_tags ?? [],
    isPublic: data.is_public,
    isFavorite: !!fav,
    isCurated: data.is_curated ?? false,
    fridgeDays: data.fridge_days ?? null,
    freezerMonths: data.freezer_months ?? null,
    batchCookingTags: data.batch_cooking_tags ?? [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    ingredients: (data.recipe_ingredients ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((ing: { id: string; recipe_id: string; custom_name: string | null; product_id: string | null; products: { id: string; name: string } | null; quantity: number; unit: string; is_optional: boolean; sort_order: number; section: string | null }) => ({
        id: ing.id,
        recipeId: ing.recipe_id,
        customName: ing.custom_name,
        productId: ing.product_id,
        productName: ing.products?.name ?? null,
        quantity: ing.quantity,
        unit: ing.unit,
        isOptional: ing.is_optional,
        sortOrder: ing.sort_order,
        section: ing.section ?? null,
      })),
    steps: (data.recipe_steps ?? [])
      .sort((a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number)
      .map((step: { id: string; recipe_id: string; step_number: number; description: string; section: string | null }) => ({
        id: step.id,
        recipeId: step.recipe_id,
        stepNumber: step.step_number,
        description: step.description,
        section: step.section ?? null,
      })),
  };
}
