import type { Recipe } from "../../domain/entities/recipe";
import { fetchRecipeById } from "../../infrastructure/supabaseRecipeRepository";

export async function getRecipeById(id: string): Promise<Recipe | null> {
  return fetchRecipeById(id);
}
