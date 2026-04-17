export interface RecipeIngredient {
  id: string;
  recipeId: string;
  customName: string | null;
  productId: string | null;
  productName: string | null;
  quantity: number;
  unit: string;
  isOptional: boolean;
  sortOrder: number;
  section: string | null;
}

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
}

export interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number;
  description: string;
  section: string | null;
}

export type BatchCookingTag = "rapide" | "legere" | "proteinee" | "gourmande" | "vegetarienne";

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  imageUrl: string | null;
  dietaryTags: string[];
  isPublic: boolean;
  isFavorite: boolean;
  isCurated: boolean;
  fridgeDays: number | null;
  freezerMonths: number | null;
  batchCookingTags: BatchCookingTag[];
  createdAt: Date;
  updatedAt: Date;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}
