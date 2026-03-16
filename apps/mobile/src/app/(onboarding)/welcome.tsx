import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { useAppTheme } from "../../shared/theme";

export default function WelcomePage() {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 24 }}>
          <View style={{ width: 100, height: 100, borderRadius: 32, backgroundColor: colors.accentBg, alignItems: "center", justifyContent: "center", shadowColor: "#E8571C", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 }}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <Path d="M3 6h18" />
              <Path d="M16 10a4 4 0 0 1-8 0" />
            </Svg>
          </View>

          <View style={{ alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 32, fontWeight: "900", color: colors.text, letterSpacing: -0.5, textAlign: "center" }}>
              Bienvenue sur Deazl
            </Text>
            <Text style={{ fontSize: 15, color: colors.textMuted, textAlign: "center", lineHeight: 22, maxWidth: 300 }}>
              Planifiez vos repas, comparez les prix et faites vos courses intelligemment.
            </Text>
          </View>

          <View style={{ gap: 14, width: "100%" }}>
            {[
              { icon: "🥗", title: "Planification des repas", desc: "Organisez votre semaine en quelques secondes" },
              { icon: "🏷️", title: "Comparaison des prix", desc: "Trouvez le meilleur prix dans vos magasins" },
              { icon: "📋", title: "Liste de courses auto", desc: "Générée automatiquement depuis vos recettes" },
            ].map((item) => (
              <View key={item.title} style={{ flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, backgroundColor: colors.bgCard, paddingHorizontal: 16, paddingVertical: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
                <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Button variant="primary" className="w-full rounded-2xl" onPress={() => router.push("/(onboarding)/household" as never)}>
          <Button.Label>Commencer</Button.Label>
        </Button>
      </View>
    </SafeAreaView>
  );
}
