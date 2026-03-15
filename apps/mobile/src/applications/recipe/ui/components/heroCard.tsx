import { LinearGradient } from "expo-linear-gradient";
import { PressableFeedback } from "heroui-native";
import { Image, Text, View } from "react-native";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import type { Recipe } from "../../domain/entities/recipe";
import { DIETARY_LABELS, fmtTime, paletteFor } from "./recipeUtils";

export function HeroCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const pal = paletteFor(recipe.name);
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const hasImg = !!recipe.imageUrl;

  return (
    <PressableFeedback
      onPress={onPress}
      style={{
        marginHorizontal: 16,
        height: 240,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: hasImg ? undefined : pal.bg,
        shadowColor: "#1C1917",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 28,
        elevation: 8,
      }}
    >
      {hasImg ? (
        <Image source={{ uri: recipe.imageUrl! }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} resizeMode="cover" />
      ) : (
        <Text style={{ position: "absolute", right: 16, top: "30%", fontSize: 140, fontWeight: "900", color: pal.accent, opacity: 0.09, lineHeight: 140 }}>
          {recipe.name.charAt(0).toUpperCase()}
        </Text>
      )}

      {hasImg ? (
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.82)"]}
          locations={[0, 0.5, 1]}
          style={{ position: "absolute", inset: 0 }}
        />
      ) : (
        <LinearGradient
          colors={[`${pal.bg}00`, pal.bg]}
          locations={[0, 0.65]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={{ position: "absolute", inset: 0 }}
        />
      )}

      {totalTime > 0 && (
        <View style={{
          position: "absolute", top: 16, right: 16,
          flexDirection: "row", alignItems: "center", gap: 4,
          borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6,
          backgroundColor: hasImg ? "rgba(0,0,0,0.38)" : `${pal.accent}20`,
        }}>
          <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={hasImg ? "#fff" : pal.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx={12} cy={12} r={10} />
            <Polyline points="12 6 12 12 16 14" />
          </Svg>
          <Text style={{ fontSize: 11, fontWeight: "700", color: hasImg ? "#fff" : pal.accent }}>{fmtTime(totalTime)}</Text>
        </View>
      )}

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20 }}>
        {recipe.dietaryTags.length > 0 && (
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            {recipe.dietaryTags.slice(0, 2).map((tag) => (
              <View key={tag} style={{
                borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2,
                backgroundColor: hasImg ? "rgba(255,255,255,0.18)" : `${pal.accent}20`,
              }}>
                <Text style={{ fontSize: 9, fontWeight: "700", color: hasImg ? "rgba(255,255,255,0.9)" : pal.text, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {DIETARY_LABELS[tag] ?? tag}
                </Text>
              </View>
            ))}
          </View>
        )}
        <Text numberOfLines={2} style={{ fontSize: 20, fontWeight: "900", color: hasImg ? "#fff" : pal.text, letterSpacing: -0.5, lineHeight: 26, marginBottom: 8 }}>
          {recipe.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={hasImg ? "rgba(255,255,255,0.65)" : pal.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <Circle cx={9} cy={7} r={4} />
            </Svg>
            <Text style={{ fontSize: 12, fontWeight: "600", color: hasImg ? "rgba(255,255,255,0.65)" : pal.accent }}>{recipe.servings} pers.</Text>
          </View>
          {recipe.ingredients.length > 0 && (
            <>
              <Text style={{ color: hasImg ? "rgba(255,255,255,0.3)" : `${pal.accent}50` }}>·</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: hasImg ? "rgba(255,255,255,0.65)" : pal.accent }}>{recipe.ingredients.length} ingr.</Text>
            </>
          )}
        </View>
      </View>
    </PressableFeedback>
  );
}
