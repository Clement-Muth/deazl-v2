import { Card, PressableFeedback } from "heroui-native";
import { Image, Text, View } from "react-native";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import type { Recipe } from "../../domain/entities/recipe";
import { useAppTheme } from "../../../../shared/theme";
import { DIETARY_LABELS, fmtTime, paletteFor } from "./recipeUtils";

export function ListCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const { colors } = useAppTheme();
  const pal = paletteFor(recipe.name);
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <Card>
      <PressableFeedback onPress={onPress} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
        <View style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", backgroundColor: recipe.imageUrl ? undefined : pal.bg, flexShrink: 0 }}>
          {recipe.imageUrl ? (
            <Image source={{ uri: recipe.imageUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "900", color: pal.accent, opacity: 0.5 }}>{recipe.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{recipe.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {totalTime > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx={12} cy={12} r={10} />
                  <Polyline points="12 6 12 12 16 14" />
                </Svg>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{fmtTime(totalTime)}</Text>
              </View>
            )}
            {recipe.dietaryTags.slice(0, 2).map((tag) => (
              <View key={tag} style={{ borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: `${pal.accent}15` }}>
                <Text style={{ fontSize: 9, fontWeight: "700", color: pal.text }}>
                  {DIETARY_LABELS[tag] ?? tag}
                </Text>
              </View>
            ))}
          </View>
          {recipe.description ? (
            <Text numberOfLines={1} style={{ fontSize: 11, color: colors.textMuted + "99" }}>{recipe.description}</Text>
          ) : null}
        </View>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E40" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="9 18 15 12 9 6" />
        </Svg>
      </PressableFeedback>
    </Card>
  );
}
