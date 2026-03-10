import { LinearGradient } from "expo-linear-gradient";
import { PressableFeedback } from "heroui-native";
import { Image, Text, View } from "react-native";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import type { Recipe } from "../../domain/entities/recipe";

const DIETARY_LABELS: Record<string, string> = {
  vegetarian: "Végé",
  vegan: "Vegan",
  gluten_free: "GF",
  lactose_free: "SF lait",
  halal: "Halal",
  kosher: "Casher",
  no_pork: "SF porc",
  no_seafood: "SF mer",
};

const PALETTES = [
  { bg: "#FFF7ED", accent: "#EA580C", text: "#9A3412" },
  { bg: "#FEF3C7", accent: "#D97706", text: "#92400E" },
  { bg: "#FDF2F8", accent: "#C026D3", text: "#701A75" },
  { bg: "#EFF6FF", accent: "#2563EB", text: "#1E3A8A" },
  { bg: "#F0FDF4", accent: "#16A34A", text: "#14532D" },
  { bg: "#FFF1F2", accent: "#E11D48", text: "#881337" },
];

function paletteForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

function fmtTime(min: number): string {
  if (min < 60) return `${min}mn`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
}

export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const pal = paletteForName(recipe.name);
  const hasImg = !!recipe.imageUrl;

  return (
    <PressableFeedback
      onPress={onPress}
      className="mb-3 rounded-2xl overflow-hidden"
      style={{
        shadowColor: "#1C1917",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      {/* Image / colored header */}
      <View style={{ height: 176, backgroundColor: pal.bg, justifyContent: "flex-end", overflow: "hidden" }}>
        {hasImg ? (
          <>
            <Image source={{ uri: recipe.imageUrl! }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} resizeMode="cover" />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.05)", "rgba(0,0,0,0.78)"]}
              locations={[0, 0.45, 1]}
              style={{ position: "absolute", inset: 0 }}
            />
          </>
        ) : (
          <Text style={{ position: "absolute", right: 8, top: "25%", fontSize: 80, fontWeight: "900", color: pal.accent, opacity: 0.11 }}>
            {recipe.name.charAt(0).toUpperCase()}
          </Text>
        )}

        {/* Time badge */}
        {totalTime > 0 && (
          <View style={{
            position: "absolute", top: 10, right: 10,
            flexDirection: "row", alignItems: "center", gap: 3,
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

        {/* Name overlay */}
        <View style={{ paddingHorizontal: 12, paddingBottom: 12, paddingTop: 40 }}>
          <Text numberOfLines={2} style={{ fontSize: 14, fontWeight: "900", lineHeight: 18, color: hasImg ? "#fff" : pal.text }}>
            {recipe.name}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: hasImg ? "#fff" : pal.bg }}>
        <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <Circle cx={9} cy={7} r={4} />
        </Svg>
        <Text style={{ fontSize: 11, fontWeight: "600", color: "#78716C" }}>{recipe.servings}</Text>
        {recipe.dietaryTags.length > 0 && (
          <>
            <Text style={{ color: "#A8A29E" }}>·</Text>
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
