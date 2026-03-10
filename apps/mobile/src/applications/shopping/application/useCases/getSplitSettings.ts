import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SplitMember {
  name: string;
  budgetCap: number;
  color: string;
}

export interface SplitSettings {
  enabled: boolean;
  members: SplitMember[];
}

const KEY = "shopping_split_settings";

export const DEFAULT_SPLIT: SplitSettings = {
  enabled: false,
  members: [
    { name: "Moi", budgetCap: 25, color: "#E8571C" },
    { name: "Nous·elle", budgetCap: 25, color: "#7C3AED" },
  ],
};

export async function getSplitSettings(): Promise<SplitSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SPLIT;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SPLIT;
  }
}

export async function updateSplitSettings(settings: SplitSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
