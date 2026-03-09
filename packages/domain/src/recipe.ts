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
  createdAt: Date;
  updatedAt: Date;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface IngredientPrice {
  price: number;
  quantity: number;
  unit: string;
  storeName: string;
  storeBrand: string | null;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  customName: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
  sortOrder: number;
  productId: string | null;
  nutriscoreGrade: string | null;
  latestPrice: IngredientPrice | null;
}

export interface RecipeStep {
  id: string;
  recipeId: string;
  stepNumber: number;
  description: string;
}
