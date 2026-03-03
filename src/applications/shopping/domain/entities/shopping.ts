export interface ShoppingItem {
  id: string;
  customName: string;
  quantity: number;
  unit: string;
  isChecked: boolean;
  sortOrder: number;
}

export interface ShoppingList {
  id: string;
  status: "active" | "completed" | "archived";
  items: ShoppingItem[];
}
