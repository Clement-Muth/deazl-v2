"use client";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import { useRouter } from "expo-router";
import { useAppTheme, type AppColors } from "../../../../shared/theme";
import type { BatchCookingTag, Recipe, RecipeIngredient } from "../../domain/entities/recipe";
import { consumePendingPreview, setPendingSwap } from "../../application/useCases/batchCookingSwapStore";
import { fetchRecipeById } from "../../infrastructure/supabaseRecipeRepository";
import { getIngredientEmoji } from "../utils/ingredientEmoji";

const HERO_HEIGHT = 420;
const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_GAP = 10;
const GRID_COLS = 3;
const GRID_PADDING = 20;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

const PALETTES: [string, string][] = [
  ["#E8571C", "#FF8C42"],
  ["#16A34A", "#4ADE80"],
  ["#7C3AED", "#A78BFA"],
  ["#0284C7", "#38BDF8"],
  ["#E11D48", "#FB7185"],
  ["#0D9488", "#2DD4BF"],
];

const TAG_LABELS: Record<BatchCookingTag, string> = {
  rapide: "Rapide", legere: "Légère", proteinee: "Protéinée", gourmande: "Gourmande", vegetarienne: "Végétarienne",
};

function paletteForName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

function fmtTime(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function fmtQty(qty: number): string {
  if (qty === Math.floor(qty)) return String(Math.floor(qty));
  return qty.toFixed(1).replace(/\.0$/, "");
}

function IngredientGrid({ ingredients, colors }: { ingredients: RecipeIngredient[]; colors: AppColors }) {
  const CATEGORY_COLORS = ["#E8571C", "#16A34A", "#0284C7", "#7C3AED", "#0D9488", "#CA8A04"];
  function categoryColor(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return CATEGORY_COLORS[Math.abs(h) % CATEGORY_COLORS.length];
  }
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP, paddingHorizontal: GRID_PADDING }}>
      {ingredients.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((ing) => {
        const name = ing.productName ?? ing.customName ?? "";
        const emoji = getIngredientEmoji(ing.customName ?? ing.productName ?? "");
        const color = categoryColor(name);
        return (
          <View
            key={ing.id}
            style={{
              width: CARD_WIDTH,
              backgroundColor: colors.bgSurface,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 8,
              alignItems: "center",
              gap: 4,
            }}
          >
            {emoji ? (
              <Text style={{ fontSize: 30 }}>{emoji}</Text>
            ) : (
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: color + "22", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color }}>{name.trim().charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text, textAlign: "center", lineHeight: 15 }} numberOfLines={2}>
              {name}
            </Text>
            {ing.quantity > 0 && (
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#E8571C" }} numberOfLines={1}>
                {fmtQty(ing.quantity)}{ing.unit ? ` ${ing.unit}` : ""}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

export function BatchCookingRecipePreviewScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [swapIndex, setSwapIndex] = useState<number>(0);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pending = consumePendingPreview();
    if (!pending) { router.canGoBack() ? router.back() : router.dismiss(); return; }
    setRecipe(pending.recipe);
    setSwapIndex(pending.swapIndex);
    fetchRecipeById(pending.recipe.id).then((full) => {
      if (full) setRecipe(full);
      setLoadingDetail(false);
    });
  }, []);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      setHeaderVisible(value >= HERO_HEIGHT - 40);
    });
    return () => scrollY.removeListener(listenerId);
  }, [scrollY]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 100, HERO_HEIGHT - 40],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const heroContentOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT / 2],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  function handleChoose() {
    if (!recipe) return;
    setPendingSwap(recipe, swapIndex);
    router.back();
  }

  if (!recipe) return null;

  const [palFrom, palTo] = paletteForName(recipe.name);
  const hasImg = !!recipe.imageUrl;
  const prepTime = recipe.prepTimeMinutes ?? 0;
  const cookTime = recipe.cookTimeMinutes ?? 0;
  const hasStats = prepTime > 0 || cookTime > 0 || recipe.servings > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>

      {/* Sticky compact header */}
      <Animated.View
        pointerEvents={headerVisible ? "auto" : "none"}
        style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
          opacity: headerOpacity,
          backgroundColor: colors.bg,
          borderBottomWidth: 1, borderBottomColor: colors.border,
          paddingTop: 52,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="15 18 9 12 15 6" />
            </Svg>
          </Pressable>
          <Text style={{ flex: 1, fontSize: 15, fontWeight: "700", color: colors.text }} numberOfLines={1}>{recipe.name}</Text>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero */}
        <View style={{ height: HERO_HEIGHT }}>
          {hasImg ? (
            <Image
              source={{ uri: recipe.imageUrl! }}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[palFrom, palTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.78)"]}
            locations={[0, 0.38, 1]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Close button */}
          <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              <Pressable
                onPress={() => router.back()}
                style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M18 6L6 18M6 6l12 12" />
                </Svg>
              </Pressable>
            </View>
          </SafeAreaView>

          {/* Hero title + meta */}
          <Animated.View style={{ position: "absolute", bottom: 60, left: 20, right: 20, opacity: heroContentOpacity }}>
            <Text style={{ fontSize: 30, fontWeight: "900", color: "#fff", letterSpacing: -0.5, lineHeight: 36, marginBottom: 14 }}>
              {recipe.name}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {prepTime + cookTime > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                    <Circle cx={12} cy={12} r={10} />
                    <Polyline points="12 6 12 12 16 14" />
                  </Svg>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>{fmtTime(prepTime + cookTime)}</Text>
                </View>
              )}
              {recipe.servings > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <Circle cx={9} cy={7} r={4} />
                  </Svg>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>{recipe.servings} pers.</Text>
                </View>
              )}
              {recipe.ingredients.length > 0 && (
                <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>{recipe.ingredients.length} ingrédients</Text>
                </View>
              )}
              {recipe.batchCookingTags.map((tag) => (
                <View key={tag} style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>{TAG_LABELS[tag]}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* White content card */}
        <View style={{ marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: colors.bg, overflow: "hidden" }}>

          {/* Stats strip */}
          {hasStats && (
            <>
              <View style={{ flexDirection: "row", paddingTop: 24, paddingBottom: 20 }}>
                {prepTime > 0 && (
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>{fmtTime(prepTime)}</Text>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSubtle, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.8 }}>Préparation</Text>
                  </View>
                )}
                {prepTime > 0 && cookTime > 0 && <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 4 }} />}
                {cookTime > 0 && (
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>{fmtTime(cookTime)}</Text>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSubtle, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.8 }}>Cuisson</Text>
                  </View>
                )}
                {(prepTime > 0 || cookTime > 0) && recipe.servings > 0 && <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 4 }} />}
                {recipe.servings > 0 && (
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>{recipe.servings}</Text>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSubtle, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.8 }}>Portions</Text>
                  </View>
                )}
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 20 }} />
            </>
          )}

          {!hasStats && <View style={{ height: 24 }} />}

          {/* Conservation band */}
          {(recipe.fridgeDays != null || recipe.freezerMonths != null) && (
            <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 8, flexDirection: "row", gap: 8 }}>
              {recipe.fridgeDays != null && recipe.fridgeDays > 0 && (
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.bgSurface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                    <Path d="M12 8v8M8 12h8" />
                  </Svg>
                  <View>
                    <Text style={{ fontSize: 11, color: colors.textSubtle, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>Réfrigérateur</Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{recipe.fridgeDays} jour{recipe.fridgeDays > 1 ? "s" : ""}</Text>
                  </View>
                </View>
              )}
              {recipe.freezerMonths != null && recipe.freezerMonths > 0 && (
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.bgSurface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
                  </Svg>
                  <View>
                    <Text style={{ fontSize: 11, color: colors.textSubtle, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>Congélateur</Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>{recipe.freezerMonths} mois</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Ingredients section */}
          <View style={{ paddingTop: 28, paddingBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.5, paddingHorizontal: 20, marginBottom: 14 }}>
              Ingrédients
            </Text>
            {loadingDetail ? (
              <ActivityIndicator color={colors.accent} size="small" style={{ marginTop: 8 }} />
            ) : recipe.ingredients.length > 0 ? (
              <IngredientGrid ingredients={recipe.ingredients} colors={colors} />
            ) : (
              <Text style={{ paddingHorizontal: 20, color: colors.textSubtle, fontSize: 14 }}>Aucun ingrédient renseigné.</Text>
            )}
          </View>

          {/* Steps — connected timeline */}
          {!loadingDetail && recipe.steps.length > 0 && (
            <View style={{ paddingTop: 36, paddingHorizontal: 20, paddingBottom: 28 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 24 }}>
                Préparation
              </Text>
              {recipe.steps
                .slice()
                .sort((a, b) => a.stepNumber - b.stepNumber)
                .map((step, i, arr) => (
                  <View key={step.id} style={{ flexDirection: "row", gap: 16 }}>
                    <View style={{ alignItems: "center", width: 36 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#E8571C", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 15, fontWeight: "900", color: "#fff" }}>{step.stepNumber}</Text>
                      </View>
                      {i < arr.length - 1 && (
                        <View style={{ width: 2, flex: 1, minHeight: 20, backgroundColor: "#FCDCC8", marginTop: 6 }} />
                      )}
                    </View>
                    <View style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 28 : 0, paddingTop: 7 }}>
                      <Text style={{ fontSize: 15, color: colors.textMuted, lineHeight: 24 }}>
                        {step.description}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          )}

        </View>
      </Animated.ScrollView>

      {/* CTA */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Pressable
          onPress={handleChoose}
          style={({ pressed }) => ({
            borderRadius: 16, backgroundColor: pressed ? colors.accentPress : colors.accent,
            paddingVertical: 18, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10,
          })}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M1 4v6h6" /><Path d="M23 20v-6h-6" />
            <Path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </Svg>
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>Choisir cette recette</Text>
        </Pressable>
      </View>

    </View>
  );
}
