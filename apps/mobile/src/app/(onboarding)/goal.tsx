import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { saveOnboardingGoal } from "../../applications/user/application/useCases/saveOnboardingGoal";
import { useAppTheme } from "../../shared/theme";

const GOALS = [
  { key: "save_money", emoji: "💰", label: "Économiser de l'argent", desc: "Optimiser mes courses et réduire le gaspillage" },
  { key: "save_time", emoji: "⏱️", label: "Gagner du temps", desc: "Préparer tous mes repas en une seule session" },
  { key: "eat_healthy", emoji: "🥗", label: "Manger sainement", desc: "Des repas équilibrés et variés chaque semaine" },
  { key: "mental_load", emoji: "🧠", label: "Réduire la charge mentale", desc: "Finis les \"qu'est-ce qu'on mange ce soir ?\"" },
];

export default function GoalPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { colors } = useAppTheme();

  async function handleNext() {
    if (!selected) return;
    setSaving(true);
    await saveOnboardingGoal(selected);
    setSaving(false);
    router.push("/(onboarding)/frequency" as never);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 48 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 18l-6-6 6-6" />
            </Svg>
          </Pressable>
          <View style={{ flex: 1, height: 3, backgroundColor: colors.border, borderRadius: 99, overflow: "hidden" }}>
            <View style={{ height: 3, width: "50%", backgroundColor: colors.accent, borderRadius: 99 }} />
          </View>
        </View>

        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -0.3, marginBottom: 8 }}>
          Ton objectif
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 32, lineHeight: 20 }}>
          Qu'est-ce qui t'a amené ici ?
        </Text>

        <View style={{ flex: 1, gap: 10 }}>
          {GOALS.map((goal) => {
            const isSelected = selected === goal.key;
            return (
              <Pressable
                key={goal.key}
                onPress={() => setSelected(goal.key)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  borderRadius: 16,
                  backgroundColor: isSelected ? colors.accentBg : colors.bgCard,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.accent : "transparent",
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontSize: 24 }}>{goal.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: isSelected ? colors.accent : colors.text, marginBottom: 2 }}>
                    {goal.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 16 }}>
                    {goal.desc}
                  </Text>
                </View>
                {isSelected && (
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20 6L9 17l-5-5" />
                    </Svg>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleNext}
          disabled={!selected || saving}
          style={({ pressed }) => ({
            backgroundColor: selected ? colors.accent : colors.border,
            borderRadius: 999,
            paddingVertical: 18,
            alignItems: "center",
            marginTop: 16,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "800", color: selected ? "#fff" : colors.textSubtle, letterSpacing: -0.2 }}>
            {saving ? "Enregistrement…" : "Continuer"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
