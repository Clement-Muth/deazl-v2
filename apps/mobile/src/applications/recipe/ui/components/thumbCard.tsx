import { LinearGradient } from "expo-linear-gradient";
import { PressableFeedback } from "heroui-native";
import { Image, Text, View } from "react-native";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import type { Recipe } from "../../domain/entities/recipe";
import { useAppTheme } from "../../../../shared/theme";
import { fmtTime, paletteFor } from "./recipeUtils";

export function ThumbCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const { colors } = useAppTheme();
  const pal = paletteFor(recipe.name);
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const hasImg = !!recipe.imageUrl;
  const badgeBg = hasImg ? "rgba(0,0,0,0.38)" : `${pal.accent}1a`;
  const badgeText = hasImg ? "#fff" : pal.accent;

  return (
    <PressableFeedback
      onPress={onPress}
      style={{
        width: 160, height: 120, borderRadius: 16, overflow: "hidden",
        backgroundColor: pal.bg,
        shadowColor: "#1C1917", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
        flexShrink: 0,
      }}
    >
      {hasImg && (
        <>
          <Image source={{ uri: recipe.imageUrl! }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} resizeMode="cover" />
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "transparent", "rgba(0,0,0,0.65)"]}
            locations={[0, 0.3, 1]}
            style={{ position: "absolute", inset: 0 }}
          />
        </>
      )}

      {!hasImg && (
        <Text style={{ position: "absolute", right: 4, top: "20%", fontSize: 64, fontWeight: "900", color: pal.accent, opacity: 0.1, lineHeight: 64 }}>
          {recipe.name.charAt(0).toUpperCase()}
        </Text>
      )}

      {/* Top right: time */}
      {totalTime > 0 && (
        <View style={{
          position: "absolute", top: 8, right: 8,
          flexDirection: "row", alignItems: "center", gap: 3,
          borderRadius: 99, paddingHorizontal: 7, paddingVertical: 3,
          backgroundColor: badgeBg,
        }}>
          <Svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={badgeText} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx={12} cy={12} r={10} />
            <Polyline points="12 6 12 12 16 14" />
          </Svg>
          <Text style={{ fontSize: 9, fontWeight: "700", color: badgeText }}>{fmtTime(totalTime)}</Text>
        </View>
      )}

      {/* Bottom: name + servings pill */}
      <View style={{ position: "absolute", bottom: 9, left: 10, right: 10 }}>
        <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "900", color: hasImg ? "#fff" : pal.text, lineHeight: 14, marginBottom: 5 }}>
          {recipe.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: badgeBg }}>
            <Svg width={8} height={8} viewBox="0 0 24 24" fill="none" stroke={badgeText} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <Circle cx={9} cy={7} r={4} />
            </Svg>
            <Text style={{ fontSize: 9, fontWeight: "700", color: badgeText }}>{recipe.servings} pers.</Text>
          </View>
          {recipe.isFavorite && (
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: badgeBg, alignItems: "center", justifyContent: "center" }}>
              <Svg width={9} height={9} viewBox="0 0 24 24" fill={badgeText} stroke="none">
                <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </Svg>
            </View>
          )}
        </View>
      </View>
    </PressableFeedback>
  );
}
