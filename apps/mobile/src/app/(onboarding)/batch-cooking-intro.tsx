import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

const GOAL_LABELS: Record<string, string> = {
  save_money: "Économiser 💰",
  save_time: "Gagner du temps ⏱️",
  eat_healthy: "Manger sainement 🥗",
  mental_load: "Moins de charge 🧠",
};

export default function BatchCookingIntroPage() {
  const router = useRouter();
  const [householdSize, setHouseholdSize] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [goal, setGoal] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const meta = user.user_metadata;
      setHouseholdSize(meta?.household_size ?? null);
      setFrequency(meta?.batch_cooking_frequency ?? null);
      setGoal(meta?.batch_cooking_goal ?? null);
    });
  }, []);

  const chips = [
    householdSize ? `🏠 ${householdSize} personne${householdSize > 1 ? "s" : ""}` : null,
    frequency ? `📅 ${frequency}× par mois` : null,
    goal ? GOAL_LABELS[goal] : null,
  ].filter(Boolean) as string[];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#E8571C" }}>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 32 }}>
          <View style={{ alignItems: "center", gap: 20 }}>
            <Text style={{ fontSize: 72, lineHeight: 80 }}>🍱</Text>
            <View style={{ alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 36, fontWeight: "900", color: "#fff", letterSpacing: -0.8, textAlign: "center", lineHeight: 40 }}>
                Tout est prêt !
              </Text>
              <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 22, maxWidth: 280 }}>
                Lance ta première session de batch cooking — tous tes repas de la semaine en une fois.
              </Text>
            </View>
          </View>

          {chips.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {chips.map((chip) => (
                <View key={chip} style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>{chip}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ width: "100%", gap: 10 }}>
            {[
              "Choisis tes recettes parmi le catalogue",
              "L'app génère ton plan de cuisine pas à pas",
              "Ta liste de courses est créée automatiquement",
            ].map((text) => (
              <View key={text} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Text style={{ fontSize: 11, color: "#fff", fontWeight: "900" }}>✓</Text>
                </View>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 20, flex: 1 }}>{text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Pressable
            onPress={() => router.replace("/batch-cooking/setup" as never)}
            style={({ pressed }) => ({
              backgroundColor: "#FFF4EE",
              borderRadius: 999,
              paddingVertical: 18,
              alignItems: "center",
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#E8571C", letterSpacing: -0.2 }}>
              Démarrer ma première session
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.replace("/(tabs)" as never)}
            style={{ alignItems: "center", paddingVertical: 12 }}
          >
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", fontWeight: "600" }}>
              Explorer l'app d'abord
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
