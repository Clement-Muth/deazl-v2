export interface ShoppingItemPrice {
  estimatedCost: number;
  storeName: string;
}

export interface ShoppingItem {
  id: string;
  customName: string;
  quantity: number;
  unit: string;
  isChecked: boolean;
  sortOrder: number;
  productId?: string | null;
  category?: string | null;
  price?: ShoppingItemPrice;
}

export interface StoreCostSummary {
  storeId: string;
  storeName: string;
  storeCity: string;
  totalCost: number;
  coveredCount: number;
  totalCount: number;
}

export interface ShoppingList {
  id: string;
  status: "active" | "completed" | "archived";
  items: ShoppingItem[];
  storeSummaries: StoreCostSummary[];
}
