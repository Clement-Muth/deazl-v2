import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { saveOnboardingFrequency } from "../../applications/user/application/useCases/saveOnboardingFrequency";
import { useAppTheme } from "../../shared/theme";

const OPTIONS = [
  { value: 1, label: "1×", sublabel: "par mois", feedback: "Un bon début — 2h max pour préparer toute ta semaine 🙌" },
  { value: 2, label: "2×", sublabel: "par mois", feedback: "Parfait pour construire une routine durable ✨" },
  { value: 3, label: "3×", sublabel: "par mois", feedback: "Excellent rythme ! Tu vas gagner un max de temps 🔥" },
  { value: 4, label: "4×+", sublabel: "par mois", feedback: "Mode pro activé — tu vas adorer le résultat ⚡" },
];

export default function FrequencyPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { colors } = useAppTheme();

  async function handleNext() {
    if (selected === null) return;
    setSaving(true);
    await saveOnboardingFrequency(selected);
    setSaving(false);
    router.push("/(onboarding)/stores" as never);
  }

  const feedbackMsg = OPTIONS.find((o) => o.value === selected)?.feedback;

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
            <View style={{ height: 3, width: "75%", backgroundColor: colors.accent, borderRadius: 99 }} />
          </View>
        </View>

        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -0.3, marginBottom: 8 }}>
          Ta fréquence
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 36, lineHeight: 20 }}>
          Combien de fois par mois veux-tu faire du batch cooking ?
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, flex: 1, alignContent: "flex-start" }}>
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setSelected(opt.value)}
                style={({ pressed }) => ({
                  width: "47%",
                  borderRadius: 18,
                  backgroundColor: isSelected ? colors.accentBg : colors.bgCard,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.accent : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 28,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontSize: 36, fontWeight: "900", color: isSelected ? colors.accent : colors.text, lineHeight: 40 }}>
                  {opt.label}
                </Text>
                <Text style={{ fontSize: 12, color: isSelected ? colors.accent : colors.textMuted, marginTop: 4, fontWeight: "600" }}>
                  {opt.sublabel}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {feedbackMsg && (
          <View style={{ backgroundColor: "#FFF4EE", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: "#92400E", lineHeight: 19, fontWeight: "500" }}>
              {feedbackMsg}
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleNext}
          disabled={selected === null || saving}
          style={({ pressed }) => ({
            backgroundColor: selected !== null ? colors.accent : colors.border,
            borderRadius: 999,
            paddingVertical: 18,
            alignItems: "center",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "800", color: selected !== null ? "#fff" : colors.textSubtle, letterSpacing: -0.2 }}>
            {saving ? "Enregistrement…" : "Continuer"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
