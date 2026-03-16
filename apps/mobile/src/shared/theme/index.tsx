import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Appearance, Platform, useColorScheme } from "react-native";

export type ThemePreference = "light" | "dark" | "auto";

const STORAGE_KEY = "@deazl/theme";

export const lightColors = {
  bg: "#FAF9F6",
  bgSurface: "#F5F3EF",
  bgCard: "#fff",
  bgSubtle: "#FAFAF8",
  text: "#1C1917",
  textMuted: "#78716C",
  textSubtle: "#A8A29E",
  accent: "#E8571C",
  accentPress: "#D14A18",
  accentBg: "#FFF7ED",
  accentBgBorder: "#FED7AA",
  border: "#E8E5E0",
  borderLight: "#E7E5E4",
  inputBorder: "#D1D5DB",
  separator: "#E8E5E0",
  handle: "#E0DDD7",
  danger: "#DC2626",
  dangerBg: "#FEE2E2",
  dangerText: "#DC2626",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  shadow: "#1C1917",
  isDark: false,
};

export const darkColors: typeof lightColors = {
  bg: "#1C1917",
  bgSurface: "#292524",
  bgCard: "#2C2825",
  bgSubtle: "#252220",
  text: "#FAF9F6",
  textMuted: "#A8A29E",
  textSubtle: "#57534E",
  accent: "#E8571C",
  accentPress: "#D14A18",
  accentBg: "#2C1810",
  accentBgBorder: "#7C3213",
  border: "#44403C",
  borderLight: "#3C3835",
  inputBorder: "#57534E",
  separator: "#44403C",
  handle: "#44403C",
  danger: "#EF4444",
  dangerBg: "#3B1111",
  dangerText: "#F87171",
  green: "#22C55E",
  greenBg: "#0F2920",
  shadow: "#000",
  isDark: true,
};

export type AppColors = typeof lightColors;

interface ThemeContextValue {
  colors: AppColors;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  preference: "auto",
  setPreference: () => {},
});

function applyColorScheme(p: ThemePreference, osScheme: "light" | "dark") {
  if (p === "auto") {
    if (Platform.OS === "android") {
      Appearance.setColorScheme(osScheme);
    } else {
      Appearance.setColorScheme(null as any);
    }
  } else {
    Appearance.setColorScheme(p);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("auto");
  const osSchemeRef = useRef<"light" | "dark">((Appearance.getColorScheme() as "light" | "dark" | null) ?? "light");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "auto") {
        setPreferenceState(saved);
        applyColorScheme(saved, osSchemeRef.current);
      }
    });
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    applyColorScheme(p, osSchemeRef.current);
    AsyncStorage.setItem(STORAGE_KEY, p);
  }, []);

  const resolvedScheme = preference === "auto" ? systemScheme : preference;
  const isDark = resolvedScheme === "dark";
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({ colors, isDark, preference, setPreference }),
    [colors, isDark, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
