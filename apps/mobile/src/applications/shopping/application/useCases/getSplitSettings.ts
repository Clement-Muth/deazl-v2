import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../../../lib/supabase";

export interface SplitMember {
  name: string;
  budgetCap: number;
  color: string;
}

export interface SplitSettings {
  enabled: boolean;
  members: SplitMember[];
  carteRestoEnabled: boolean;
}

export const DEFAULT_SPLIT: SplitSettings = {
  enabled: false,
  members: [
    { name: "Moi", budgetCap: 25, color: "#E8571C" },
    { name: "Nous·elle", budgetCap: 25, color: "#7C3AED" },
  ],
  carteRestoEnabled: false,
};

async function getKey(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return `shopping_split_settings_${user.id}`;
}

export async function getSplitSettings(): Promise<SplitSettings> {
  try {
    const key = await getKey();
    if (!key) return DEFAULT_SPLIT;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return DEFAULT_SPLIT;
    return { ...DEFAULT_SPLIT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SPLIT;
  }
}

export async function updateSplitSettings(settings: SplitSettings): Promise<void> {
  try {
    const key = await getKey();
    if (!key) return;
    await AsyncStorage.setItem(key, JSON.stringify(settings));
  } catch {}
}
