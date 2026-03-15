import { LinearGradient } from "expo-linear-gradient";
import { PressableFeedback } from "heroui-native";
import { Image, Text, View } from "react-native";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import type { Recipe } from "../../domain/entities/recipe";
import { DIETARY_LABELS, fmtTime, paletteFor } from "./recipeUtils";

export function GridCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const pal = paletteFor(recipe.name);
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const hasImg = !!recipe.imageUrl;

  return (
    <PressableFeedback
      onPress={onPress}
      style={{
        flex: 1, borderRadius: 16, overflow: "hidden",
        backgroundColor: hasImg ? undefined : pal.bg,
        shadowColor: "#1C1917", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
      }}
    >
      <View style={{ height: 176, justifyContent: "flex-end", overflow: "hidden" }}>
        {hasImg ? (
          <>
            <Image source={{ uri: recipe.imageUrl! }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} resizeMode="cover" />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.05)", "rgba(0,0,0,0.78)"]} locations={[0, 0.45, 1]} style={{ position: "absolute", inset: 0 }} />
          </>
        ) : (
          <Text style={{ position: "absolute", right: 8, top: "30%", fontSize: 80, fontWeight: "900", color: pal.accent, opacity: 0.11, lineHeight: 80 }}>
            {recipe.name.charAt(0).toUpperCase()}
          </Text>
        )}

        {totalTime > 0 && (
          <View style={{
            position: "absolute", top: 10, right: 10,
            flexDirection: "row", alignItems: "center", gap: 4,
            borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4,
            backgroundColor: hasImg ? "rgba(0,0,0,0.38)" : `${pal.accent}1a`,
          }}>
            <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={hasImg ? "#fff" : pal.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={12} cy={12} r={10} />
              <Polyline points="12 6 12 12 16 14" />
            </Svg>
            <Text style={{ fontSize: 10, fontWeight: "700", color: hasImg ? "#fff" : pal.accent }}>{fmtTime(totalTime)}</Text>
          </View>
        )}

        <View style={{ paddingHorizontal: 12, paddingBottom: 12, paddingTop: 40 }}>
          <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: "900", color: hasImg ? "#fff" : pal.text, lineHeight: 17 }}>
            {recipe.name}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: hasImg ? "#fff" : pal.bg }}>
        <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#A8A29E80" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <Circle cx={9} cy={7} r={4} />
        </Svg>
        <Text style={{ fontSize: 11, fontWeight: "600", color: "#78716C" }}>{recipe.servings}</Text>
        {recipe.dietaryTags.length > 0 && (
          <>
            <Text style={{ color: "#A8A29E40" }}>·</Text>
            <View style={{ borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: `${pal.accent}15` }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color: pal.text, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {DIETARY_LABELS[recipe.dietaryTags[0]] ?? recipe.dietaryTags[0]}
              </Text>
            </View>
          </>
        )}
      </View>
    </PressableFeedback>
  );
}
