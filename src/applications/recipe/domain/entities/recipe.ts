export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  imageUrl: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  customName: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
  sortOrder: number;
}

export interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number;
  description: string;
}
