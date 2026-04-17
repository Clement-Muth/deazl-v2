import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "batch_cooking_margin";
export const DEFAULT_MARGIN = 0.25;

export async function getBatchCookingMargin(): Promise<number> {
  const stored = await AsyncStorage.getItem(KEY);
  return stored !== null ? parseFloat(stored) : DEFAULT_MARGIN;
}

export async function setBatchCookingMargin(margin: number): Promise<void> {
  await AsyncStorage.setItem(KEY, margin.toString());
}
