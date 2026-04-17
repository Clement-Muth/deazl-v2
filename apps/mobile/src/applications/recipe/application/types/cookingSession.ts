export interface MiseEnPlaceItem {
  ingredient: string;
  quantity: string;
  preparation: string | null;
  recipe_name: string;
}

export interface StepIngredient {
  name: string;
  quantity: string;
}

export interface CookingStep {
  index: number;
  title: string;
  description: string;
  duration_minutes: number | null;
  temperature: string | null;
  recipes_involved: string[];
  is_parallel: boolean;
  ingredients: StepIngredient[];
}

export interface ConservationTip {
  recipe_name: string;
  container: string;
  fridge_days: number | null;
  freezer_months: number | null;
}

export interface CookingSession {
  total_minutes: number;
  ustensiles: string[];
  mise_en_place: MiseEnPlaceItem[];
  steps: CookingStep[];
  conservation: ConservationTip[];
}
