import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Path } from "react-native-svg";
import { updateHouseholdSize } from "../../applications/user/application/useCases/updateHouseholdSize";
import { useAppTheme } from "../../shared/theme";

export default function HouseholdPage() {
  const router = useRouter();
  const [size, setSize] = useState(2);
  const [saving, setSaving] = useState(false);
  const { colors } = useAppTheme();

  async function handleNext() {
    setSaving(true);
    await updateHouseholdSize(size);
    setSaving(false);
    router.push("/(onboarding)/goal" as never);
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
            <View style={{ height: 3, width: "25%", backgroundColor: colors.accent, borderRadius: 99 }} />
          </View>
        </View>

        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -0.3, marginBottom: 8 }}>
          Ton foyer
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 48, lineHeight: 20 }}>
          Combien de personnes ? On adapte les quantités dans tes recettes.
        </Text>

        <View style={{ alignItems: "center", gap: 8, flex: 1, justifyContent: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 40 }}>
            <Pressable
              onPress={() => setSize((s) => Math.max(1, s - 1))}
              style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: size > 1 ? colors.bgSurface : colors.bgSubtle, alignItems: "center", justifyContent: "center", opacity: size > 1 ? 1 : 0.4 }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Line x1={5} y1={12} x2={19} y2={12} />
              </Svg>
            </Pressable>

            <View style={{ alignItems: "center", minWidth: 80 }}>
              <Text style={{ fontSize: 80, fontWeight: "900", color: colors.text, lineHeight: 88 }}>{size}</Text>
              <Text style={{ fontSize: 14, color: colors.textMuted }}>personne{size > 1 ? "s" : ""}</Text>
            </View>

            <Pressable
              onPress={() => setSize((s) => s + 1)}
              style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: colors.accentBg, alignItems: "center", justifyContent: "center" }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Line x1={12} y1={5} x2={12} y2={19} />
                <Line x1={5} y1={12} x2={19} y2={12} />
              </Svg>
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 6, marginTop: 20 }}>
            {Array.from({ length: Math.min(size, 8) }).map((_, i) => (
              <View key={i} style={{ width: 10, height: 10, borderRadius: 99, backgroundColor: colors.accent }} />
            ))}
            {size > 8 && <Text style={{ fontSize: 12, color: colors.accent, fontWeight: "700" }}>+{size - 8}</Text>}
          </View>
        </View>

        <Button variant="primary" className="w-full rounded-2xl" onPress={handleNext} isDisabled={saving}>
          <Button.Label>{saving ? "Enregistrement…" : "Continuer"}</Button.Label>
        </Button>
      </View>
    </SafeAreaView>
  );
}
