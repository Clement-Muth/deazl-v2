import type { Recipe } from "../../domain/entities/recipe";
import { fetchCuratedRecipes } from "../../infrastructure/supabaseRecipeRepository";

export async function getCuratedRecipes(): Promise<Recipe[]> {
  return fetchCuratedRecipes();
}
