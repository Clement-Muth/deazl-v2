import { LinearGradient } from "expo-linear-gradient";
import { PressableFeedback } from "heroui-native";
import { Image, Text, View } from "react-native";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import type { Recipe } from "../../domain/entities/recipe";
import { useAppTheme } from "../../../../shared/theme";
import { DIETARY_LABELS, fmtTime, paletteFor } from "./recipeUtils";

export function GridCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
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
        flex: 1, borderRadius: 16, overflow: "hidden",
        backgroundColor: pal.bg,
        shadowColor: "#1C1917", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
      }}
    >
      <View style={{ height: 200 }}>
        {hasImg && (
          <>
            <Image source={{ uri: recipe.imageUrl! }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(0,0,0,0.22)", "transparent", "rgba(0,0,0,0.72)"]}
              locations={[0, 0.35, 1]}
              style={{ position: "absolute", inset: 0 }}
            />
          </>
        )}

        {!hasImg && (
          <Text style={{ position: "absolute", right: 8, top: "25%", fontSize: 88, fontWeight: "900", color: pal.accent, opacity: 0.1, lineHeight: 88 }}>
            {recipe.name.charAt(0).toUpperCase()}
          </Text>
        )}

        {/* Top row */}
        <View style={{ position: "absolute", top: 10, left: 10, right: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          {recipe.dietaryTags.length > 0 ? (
            <View style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: badgeBg }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color: hasImg ? "rgba(255,255,255,0.9)" : pal.text, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {DIETARY_LABELS[recipe.dietaryTags[0]] ?? recipe.dietaryTags[0]}
              </Text>
            </View>
          ) : (
            <View />
          )}

          {totalTime > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: badgeBg }}>
              <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={badgeText} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx={12} cy={12} r={10} />
                <Polyline points="12 6 12 12 16 14" />
              </Svg>
              <Text style={{ fontSize: 10, fontWeight: "700", color: badgeText }}>{fmtTime(totalTime)}</Text>
            </View>
          )}
        </View>

        {/* Bottom */}
        <View style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
          <Text numberOfLines={2} style={{ fontSize: 13, fontWeight: "900", color: hasImg ? "#fff" : pal.text, lineHeight: 17, marginBottom: 7 }}>
            {recipe.name}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: badgeBg }}>
              <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={badgeText} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <Circle cx={9} cy={7} r={4} />
              </Svg>
              <Text style={{ fontSize: 10, fontWeight: "700", color: badgeText }}>{recipe.servings} pers.</Text>
            </View>
            {recipe.ingredients.length > 0 && (
              <View style={{ borderRadius: 99, paddingHorizontal: 7, paddingVertical: 3, backgroundColor: badgeBg }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: badgeText }}>{recipe.ingredients.length} ingr.</Text>
              </View>
            )}
            {recipe.isFavorite && (
              <View style={{ marginLeft: "auto", width: 24, height: 24, borderRadius: 12, backgroundColor: badgeBg, alignItems: "center", justifyContent: "center" }}>
                <Svg width={11} height={11} viewBox="0 0 24 24" fill={badgeText} stroke="none">
                  <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </Svg>
              </View>
            )}
          </View>
        </View>
      </View>
    </PressableFeedback>
  );
}
