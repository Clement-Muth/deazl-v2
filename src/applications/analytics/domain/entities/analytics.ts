export interface ListStat {
  id: string;
  createdAt: string;
  totalItems: number;
  checkedItems: number;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface PricePoint {
  date: string;
  price: number;
  storeName: string;
  unit: string;
  quantity: number;
}

export interface IngredientPriceHistory {
  ingredientName: string;
  points: PricePoint[];
}

export interface StoreComparison {
  storeName: string;
  storeBrand: string | null;
  storeCity: string | null;
  reportCount: number;
  avgPricePerKg: number | null;
}

export interface AnalyticsSummary {
  totalLists: number;
  totalItemsChecked: number;
  avgCompletionRate: number;
  recentLists: ListStat[];
  categoryBreakdown: CategoryStat[];
}
