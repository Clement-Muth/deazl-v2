import type { Recipe } from "../../domain/entities/recipe";
import { fetchRecipes } from "../../infrastructure/supabaseRecipeRepository";

export async function getRecipes(): Promise<Recipe[]> {
  return fetchRecipes();
}
