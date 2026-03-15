import { LinearGradient } from "expo-linear-gradient";
import { PressableFeedback } from "heroui-native";
import { Image, Text, View } from "react-native";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import type { Recipe } from "../../domain/entities/recipe";
import { fmtTime, paletteFor } from "./recipeUtils";

export function ThumbCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const pal = paletteFor(recipe.name);
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const hasImg = !!recipe.imageUrl;

  return (
    <PressableFeedback
      onPress={onPress}
      style={{
        width: 160, borderRadius: 16, overflow: "hidden",
        backgroundColor: hasImg ? "#fff" : pal.bg,
        shadowColor: "#1C1917", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
        flexShrink: 0,
      }}
    >
      <View style={{ height: 112, backgroundColor: pal.bg, overflow: "hidden" }}>
        {hasImg ? (
          <>
            <Image source={{ uri: recipe.imageUrl! }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} resizeMode="cover" />
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.65)"]} locations={[0.45, 1]} style={{ position: "absolute", inset: 0 }} />
          </>
        ) : (
          <Text style={{ position: "absolute", right: 4, top: "30%", fontSize: 68, fontWeight: "900", color: pal.accent, opacity: 0.11, lineHeight: 68 }}>
            {recipe.name.charAt(0).toUpperCase()}
          </Text>
        )}
        {totalTime > 0 && (
          <View style={{
            position: "absolute", bottom: 8, right: 8,
            flexDirection: "row", alignItems: "center", gap: 2,
            borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2,
            backgroundColor: hasImg ? "rgba(0,0,0,0.4)" : `${pal.accent}1a`,
          }}>
            <Svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={hasImg ? "#fff" : pal.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={12} cy={12} r={10} />
              <Polyline points="12 6 12 12 16 14" />
            </Svg>
            <Text style={{ fontSize: 9, fontWeight: "700", color: hasImg ? "#fff" : pal.accent }}>{fmtTime(totalTime)}</Text>
          </View>
        )}
        {hasImg && (
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 10, paddingBottom: 8 }}>
            <Text numberOfLines={2} style={{ fontSize: 11, fontWeight: "900", color: "#fff", lineHeight: 14 }}>{recipe.name}</Text>
          </View>
        )}
      </View>
      {!hasImg && (
        <View style={{ paddingHorizontal: 10, paddingVertical: 8, gap: 2 }}>
          <Text numberOfLines={2} style={{ fontSize: 11, fontWeight: "700", color: pal.text, lineHeight: 14 }}>{recipe.name}</Text>
          <Text style={{ fontSize: 10, color: `${pal.accent}80` }}>{recipe.servings} pers.</Text>
        </View>
      )}
      {hasImg && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#A8A29E80" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <Circle cx={9} cy={7} r={4} />
          </Svg>
          <Text style={{ fontSize: 10, fontWeight: "600", color: "#78716C99" }}>{recipe.servings} pers.</Text>
        </View>
      )}
    </PressableFeedback>
  );
}
