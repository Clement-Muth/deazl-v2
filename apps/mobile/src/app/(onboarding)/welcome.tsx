import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Path } from "react-native-svg";

function DeazlIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <Path d="M3 6h18" />
      <Path d="M16 10a4 4 0 0 1-8 0" />
    </Svg>
  );
}

export default function WelcomePage() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#E8571C" }}>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 48, paddingBottom: 40 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 32 }}>
          <View style={{ alignItems: "center", gap: 24 }}>
            <View style={{ width: 90, height: 90, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center" }}>
              <DeazlIcon />
            </View>
            <View style={{ alignItems: "center", gap: 12 }}>
              <Text style={{ fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: -1, textAlign: "center", lineHeight: 42 }}>
                Cuisinez malin,{"\n"}faites vos courses{"\n"}mieux
              </Text>
              <Text style={{ fontSize: 15, color: "rgba(255,255,255,0.72)", textAlign: "center", lineHeight: 22, maxWidth: 280 }}>
                De la planification jusqu'à la caisse — sans effort.
              </Text>
            </View>
          </View>

          <View style={{ gap: 10, width: "100%" }}>
            {[
              { icon: "🍳", text: "Batch cook en une session" },
              { icon: "📋", text: "Liste de courses automatique" },
              { icon: "🏷️", text: "Meilleur prix dans tes magasins" },
            ].map((item) => (
              <View key={item.text} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/(onboarding)/household" as never)}
          style={({ pressed }) => ({
            backgroundColor: "#FFF4EE",
            borderRadius: 999,
            paddingVertical: 18,
            alignItems: "center",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#E8571C", letterSpacing: -0.2 }}>
            Commencer
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
