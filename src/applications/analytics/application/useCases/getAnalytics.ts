import { createClient } from "@/lib/supabase/server";
import { getMondayOf, formatWeekParam } from "@/applications/planning/lib/weekUtils";

export interface TopRecipe {
  recipeId: string;
  recipeName: string;
  imageUrl: string | null;
  count: number;
  dietaryTags: string[];
}

export interface NutriscoreDistribution {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

export interface Analytics {
  thisWeek: {
    filledSlots: number;
    totalSlots: number;
    breakfastCount: number;
    lunchCount: number;
    dinnerCount: number;
  };
  allTime: {
    totalMealsPlanned: number;
    totalRecipes: number;
  };
  topRecipes: TopRecipe[];
  nutriscoreDistribution: NutriscoreDistribution;
  weeklyBudget: number;
}

export async function getAnalytics(): Promise<Analytics> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const emptyNutriscore: NutriscoreDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  const empty: Analytics = {
    thisWeek: { filledSlots: 0, totalSlots: 21, breakfastCount: 0, lunchCount: 0, dinnerCount: 0 },
    allTime: { totalMealsPlanned: 0, totalRecipes: 0 },
    topRecipes: [],
    nutriscoreDistribution: emptyNutriscore,
    weeklyBudget: 0,
  };

  if (!user) return empty;

  const weekParam = formatWeekParam(getMondayOf(new Date()));

  const [{ data: plans }, { count: totalRecipes }] = await Promise.all([
    supabase.from("meal_plans").select("id, week_start").eq("user_id", user.id),
    supabase.from("recipes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const planIds = (plans ?? []).map((p) => p.id);
  const currentPlan = (plans ?? []).find((p) => p.week_start === weekParam);

  if (planIds.length === 0) {
    return { ...empty, allTime: { totalMealsPlanned: 0, totalRecipes: totalRecipes ?? 0 }, nutriscoreDistribution: emptyNutriscore };
  }

  const { data: allSlots } = await supabase
    .from("meal_slots")
    .select("recipe_id, meal_type, meal_plan_id, recipes(id, name, image_url, dietary_tags)")
    .in("meal_plan_id", planIds)
    .not("recipe_id", "is", null);

  const slots = allSlots ?? [];
  const thisWeekSlots = currentPlan ? slots.filter((s) => s.meal_plan_id === currentPlan.id) : [];

  const countMap = new Map<string, { name: string; count: number; imageUrl: string | null; dietaryTags: string[] }>();
  for (const slot of slots) {
    const recipeRaw = Array.isArray(slot.recipes) ? slot.recipes[0] : slot.recipes;
    const recipe = recipeRaw as { id: string; name: string; image_url: string | null; dietary_tags: string[] } | null;
    if (!recipe || !slot.recipe_id) continue;
    const key = slot.recipe_id as string;
    const existing = countMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      countMap.set(key, { name: recipe.name, count: 1, imageUrl: recipe.image_url, dietaryTags: recipe.dietary_tags ?? [] });
    }
  }

  const topRecipes = [...countMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, d]) => ({ recipeId: id, recipeName: d.name, imageUrl: d.imageUrl, count: d.count, dietaryTags: d.dietaryTags }));

  const thisWeekRecipeIds = [...new Set(
    thisWeekSlots.map((s) => s.recipe_id as string).filter(Boolean)
  )];

  const nutriscoreDistribution = { ...emptyNutriscore };
  let weeklyBudget = 0;

  if (thisWeekRecipeIds.length > 0) {
    const { data: ingRows } = await supabase
      .from("recipe_ingredients")
      .select("product_id, quantity, unit, products(nutriscore_grade)")
      .in("recipe_id", thisWeekRecipeIds)
      .not("product_id", "is", null);

    for (const row of (ingRows ?? [])) {
      const prod = Array.isArray(row.products) ? row.products[0] : row.products;
      const grade = (prod as { nutriscore_grade: string | null } | null)?.nutriscore_grade?.toUpperCase();
      if (grade && grade in nutriscoreDistribution) {
        nutriscoreDistribution[grade as keyof NutriscoreDistribution]++;
      }
    }

    const productIds = [...new Set((ingRows ?? []).map((r) => r.product_id as string).filter(Boolean))];
    if (productIds.length > 0) {
      const { data: priceRows } = await supabase
        .from("latest_prices")
        .select("product_id, price, quantity, unit")
        .in("product_id", productIds);

      const cheapest = new Map<string, { price: number; quantity: number; unit: string }>();
      for (const p of (priceRows ?? [])) {
        if (!cheapest.has(p.product_id)) {
          cheapest.set(p.product_id, { price: p.price, quantity: p.quantity, unit: p.unit });
        }
      }

      const norm = (u: string) => (u ?? "").toLowerCase().trim();
      for (const ing of (ingRows ?? [])) {
        const pid = ing.product_id as string | null;
        if (!pid) continue;
        const p = cheapest.get(pid);
        if (!p) continue;
        if (norm(ing.unit) === norm(p.unit) && p.quantity > 0) {
          weeklyBudget += (ing.quantity / p.quantity) * p.price;
        } else {
          weeklyBudget += p.price;
        }
      }
    }
  }

  return {
    thisWeek: {
      filledSlots: thisWeekSlots.length,
      totalSlots: 21,
      breakfastCount: thisWeekSlots.filter((s) => s.meal_type === "breakfast").length,
      lunchCount: thisWeekSlots.filter((s) => s.meal_type === "lunch").length,
      dinnerCount: thisWeekSlots.filter((s) => s.meal_type === "dinner").length,
    },
    allTime: {
      totalMealsPlanned: slots.length,
      totalRecipes: totalRecipes ?? 0,
    },
    topRecipes,
    nutriscoreDistribution,
    weeklyBudget,
  };
}
