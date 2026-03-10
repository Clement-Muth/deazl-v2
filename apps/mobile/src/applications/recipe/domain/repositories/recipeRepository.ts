import type { Recipe } from "../entities/recipe";

export interface RecipeRepository {
  findAll(householdId: string): Promise<Recipe[]>;
  findById(id: string): Promise<Recipe | null>;
}
