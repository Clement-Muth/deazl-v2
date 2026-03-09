export type StorageLocation = "fridge" | "freezer" | "pantry" | "other";

export interface PantryItem {
  id: string;
  customName: string;
  quantity: number | null;
  unit: string | null;
  expiryDate: string | null;
  location: StorageLocation;
  createdAt: string;
}

export const LOCATION_LABELS: Record<StorageLocation, string> = {
  fridge: "Frigo",
  freezer: "Congélateur",
  pantry: "Placard",
  other: "Autre",
};

export const LOCATION_ORDER: StorageLocation[] = ["fridge", "freezer", "pantry", "other"];
