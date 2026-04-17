import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path, Polygon } from "react-native-svg";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { consumeNextPendingBadge, hasPendingBadges } from "../../application/useCases/pendingBadgeStore";
import type { BadgeDefinition } from "../../domain/badges";

function StarIcon({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="#FBBF24" stroke="#F59E0B" strokeWidth={1}>
      <Polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </Svg>
  );
}

function BadgeSticker({ badge }: { badge: BadgeDefinition }) {
  return (
    <View style={{ alignItems: "center", marginVertical: 32 }}>
      <Animated.View entering={ZoomIn.delay(150).springify()} style={{ alignItems: "center" }}>
        <View style={{ position: "absolute", top: -14, zIndex: 2 }}>
          <StarIcon size={36} />
        </View>
        <View style={{
          width: 196, height: 196, borderRadius: 98,
          backgroundColor: "#fff",
          alignItems: "center", justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.18,
          shadowRadius: 24,
          elevation: 12,
        }}>
          <View style={{
            width: 172, height: 172, borderRadius: 86,
            backgroundColor: badge.color + "30",
            alignItems: "center", justifyContent: "center",
            padding: 20,
          }}>
            <Text style={{
              fontSize: 24, fontWeight: "900", color: badge.color,
              textAlign: "center", letterSpacing: 0.5, lineHeight: 30,
              textTransform: "uppercase",
            }}>
              {badge.name}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export function BadgeUnlockScreen() {
  const router = useRouter();
  const badge = consumeNextPendingBadge();

  function handleClose() {
    if (hasPendingBadges()) {
      router.replace("/badge-unlock");
    } else {
      router.dismiss();
    }
  }

  if (!badge) {
    router.dismiss();
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: badge.color }}>
      <View style={{
        position: "absolute", top: -60, left: -60,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: "rgba(255,255,255,0.08)",
      }} />
      <View style={{
        position: "absolute", bottom: -40, right: -40,
        width: 240, height: 240, borderRadius: 120,
        backgroundColor: "rgba(255,255,255,0.06)",
      }} />

      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <BadgeSticker badge={badge} />

        <Animated.View
          entering={FadeInDown.delay(100)}
          style={{
            backgroundColor: "rgba(255,255,255,0.22)",
            borderRadius: 100, paddingHorizontal: 16, paddingVertical: 7,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
            {badge.levelLabel}
          </Text>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(180)}
          style={{ fontSize: 36, fontWeight: "900", color: "#fff", textAlign: "center", lineHeight: 42, marginBottom: 16 }}
        >
          Nouveau badge{"\n"}débloqué !
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(260)}
          style={{ fontSize: 15, color: "rgba(255,255,255,0.80)", textAlign: "center", lineHeight: 22, marginBottom: 48 }}
        >
          {badge.description}
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(340)} style={{ width: "100%" }}>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "rgba(255,255,255,0.85)" : "#fff",
              borderRadius: 100, paddingVertical: 18,
              alignItems: "center",
            })}
          >
            <Text style={{ fontSize: 17, fontWeight: "900", color: badge.color }}>
              {hasPendingBadges() ? "Suivant →" : "Super !"}
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
