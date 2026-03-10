export type PriceConfidence = "exact" | "brand_city" | "national";

export interface ShoppingItemPrice {
  estimatedCost: number;
  storeName: string;
  confidence: PriceConfidence;
  reportedAt: string | null;
  reporterCount: number;
}

export interface ShoppingItemStorePrice {
  storeId: string;
  storeName: string;
  estimatedCost: number;
  confidence: PriceConfidence;
  reportedAt: string | null;
  reporterCount: number;
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
  allStorePrices: ShoppingItemStorePrice[];
}

export interface StoreCostSummary {
  storeId: string;
  storeName: string;
  storeCity: string;
  totalCost: number;
  coveredCount: number;
  totalCount: number;
  hasEstimates: boolean;
  latestReportedAt: string | null;
}

export interface ShoppingList {
  id: string;
  status: "active" | "completed" | "archived";
  items: ShoppingItem[];
  storeSummaries: StoreCostSummary[];
}
