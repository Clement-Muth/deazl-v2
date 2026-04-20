"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import ReanimatedAnimated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, withSequence, runOnJS, FadeIn, FadeInDown, FadeInUp, FadeOutLeft, SlideInRight, SlideOutLeft, Layout, ZoomIn } from "react-native-reanimated";
import { useAppTheme } from "../../../../shared/theme";
import type { BatchCookingTag, Recipe } from "../../domain/entities/recipe";
import type { BatchRecipeSuggestion } from "../../application/useCases/suggestBatchCookingRecipes";
import { suggestBatchCookingRecipes } from "../../application/useCases/suggestBatchCookingRecipes";
import { generateBatchCookingPlan } from "../../application/useCases/generateBatchCookingPlan";
import { generateCookingSession } from "../../application/useCases/generateCookingSession";
import { setPendingGeneration } from "../../application/useCases/cookingSessionStore";
import { setPendingPreview, consumePendingSwap, consumePendingEditSuggestions } from "../../application/useCases/batchCookingSwapStore";
import { BottomModal, BottomModalScrollView } from "../../../shopping/ui/components/bottomModal";

const TAG_LABELS: Record<BatchCookingTag, string> = {
  rapide: "Rapide",
  legere: "Légère",
  proteinee: "Protéinée",
  gourmande: "Gourmande",
  vegetarienne: "Végétarienne",
};

const TAG_COLORS: Record<BatchCookingTag, { bg: string; text: string }> = {
  rapide:       { bg: "rgba(194, 65, 12, 0.12)",  text: "#C2410C" },
  legere:       { bg: "rgba(22, 163, 74, 0.12)",   text: "#16A34A" },
  proteinee:    { bg: "rgba(29, 78, 216, 0.12)",   text: "#1D4ED8" },
  gourmande:    { bg: "rgba(146, 64, 14, 0.12)",   text: "#92400E" },
  vegetarienne: { bg: "rgba(21, 128, 61, 0.12)",   text: "#15803D" },
};

export function BatchCookingReviewScreen({ mealCount, persons, recipeCount }: {
  mealCount: number;
  persons: number;
  recipeCount: 1 | 2 | 3;
}) {
  const { colors } = useAppTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<BatchRecipeSuggestion[]>([]);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const isAdding = swapIndex === -1;
  const [allCurated, setAllCurated] = useState<Recipe[]>([]);
  const [activeTag, setActiveTag] = useState<BatchCookingTag | null>(null);

  useEffect(() => {
    const editSuggestions = consumePendingEditSuggestions();
    if (editSuggestions) {
      setSuggestions(editSuggestions.map((s) => ({
        recipe: s.recipe,
        portions: s.portions,
        fridge_days: s.recipe.fridgeDays ?? null,
        freezer_months: s.recipe.freezerMonths ?? null,
      })));
      setLoading(false);
    } else {
      load([]);
    }
  }, []);

  async function load(excludeIds: string[]) {
    setLoading(true);
    const results = await suggestBatchCookingRecipes(recipeCount, mealCount, excludeIds);
    setSuggestions(results);
    setLoading(false);
  }

  async function loadCatalog() {
    if (allCurated.length > 0) return;
    const { fetchCuratedRecipes } = await import("../../infrastructure/supabaseRecipeRepository");
    const recipes = await fetchCuratedRecipes();
    setAllCurated(recipes);
  }

  function openSwap(index: number) {
    setSwapIndex(index);
    setCatalogOpen(true);
    loadCatalog();
  }

  function openAdd() {
    setSwapIndex(-1);
    setCatalogOpen(true);
    loadCatalog();
  }

  function openPreview(recipe: Recipe) {
    if (swapIndex === null || swapIndex === -1) return;
    setPendingPreview(recipe, swapIndex);
    setCatalogOpen(false);
    router.push("/batch-cooking/recipe-preview");
  }

  function addRecipe(recipe: Recipe) {
    setSuggestions((prev) => [...prev, {
      recipe,
      portions: persons,
      fridge_days: recipe.fridgeDays ?? null,
      freezer_months: recipe.freezerMonths ?? null,
    }]);
    setAllCurated((prev) => prev.filter((r) => r.id !== recipe.id));
    setCatalogOpen(false);
    setSwapIndex(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function removeRecipe(index: number) {
    if (suggestions.length <= 1) return;
    const removed = suggestions[index];
    setSuggestions((prev) => prev.filter((_, i) => i !== index));
    setAllCurated((prev) => [...prev, removed.recipe]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function applySwap(recipe: Recipe, index: number) {
    const current = suggestions[index];
    const updated = suggestions.map((s, i) =>
      i === index ? { ...s, recipe } : s
    );
    setSuggestions(updated);
    setSwapIndex(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (current) {
      setAllCurated((prev) => prev.filter((r) => r.id !== recipe.id).concat(current.recipe));
    }
  }

  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingSwap();
      if (pending) {
        applySwap(pending.recipe, pending.swapIndex);
      }
    }, [suggestions])
  );

  function updatePortions(index: number, delta: number) {
    setSuggestions((prev) => {
      const updated = [...prev];
      const newPortions = Math.max(1, updated[index].portions + delta);
      updated[index] = { ...updated[index], portions: newPortions };
      return updated;
    });
  }

  async function handleValidate() {
    setGenerating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const recipeIds = suggestions.map((s) => s.recipe.id);
    try {
      await generateBatchCookingPlan(
        suggestions.map((s) => ({ recipeId: s.recipe.id, portions: s.portions })),
        persons
      );
      setPendingGeneration(generateCookingSession(recipeIds));
      router.navigate("/(tabs)" as never);
    } finally {
      setGenerating(false);
    }
  }

  const filteredCatalog = activeTag
    ? allCurated.filter((r) => r.batchCookingTags.includes(activeTag))
    : allCurated;

  const usedIds = new Set(suggestions.map((s) => s.recipe.id));
  const availableCatalog = filteredCatalog.filter((r) => !usedIds.has(r.id));

  if (loading) {
    return <LoadingScreen />;
  }

  if (generating) {
    return <GeneratingScreen />;
  }

  const totalPortions = suggestions.reduce((sum, s) => sum + s.portions, 0);
  const totalMinutes = suggestions.reduce((sum, s) => sum + (s.recipe.cookTimeMinutes ?? 0) + (s.recipe.prepTimeMinutes ?? 0), 0);
  const cookTimeLabel = totalMinutes === 0 ? null : totalMinutes < 60 ? `${totalMinutes}min` : `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 > 0 ? String(totalMinutes % 60).padStart(2, "0") : ""}`;


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "bottom"]}>

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.dismiss()}
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 12,
            backgroundColor: colors.bgSurface,
            alignItems: "center", justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </Pressable>
        <Text style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: colors.text }}>
          Mon batch cooking
        </Text>
        <View style={{ borderRadius: 10, backgroundColor: colors.accentBg, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.accent }}>{totalPortions} repas</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {suggestions.map((s, i) => (
          <RecipeCard
            key={`${s.recipe.id}-${i}`}
            index={i}
            suggestion={s}
            onSwap={() => openSwap(i)}
            onRemove={suggestions.length > 1 ? () => removeRecipe(i) : undefined}
            onPortionsChange={(delta) => updatePortions(i, delta)}
            colors={colors}
          />
        ))}
        <ReanimatedAnimated.View entering={FadeInUp.delay(suggestions.length * 80 + 100)}>
          <Pressable
            onPress={openAdd}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.accent,
              paddingVertical: 16, marginTop: 4, opacity: pressed ? 0.6 : 1,
            })}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 5v14M5 12h14" />
            </Svg>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.accent }}>Ajouter un plat</Text>
          </Pressable>
        </ReanimatedAnimated.View>
      </ScrollView>

      {/* CTA */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 32, paddingTop: 16, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border, gap: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 20 }}>
          <View style={{ alignItems: "center", gap: 2 }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>{totalPortions}</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>repas</Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 4 }} />
          <View style={{ alignItems: "center", gap: 2 }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>{suggestions.length}</Text>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>recette{suggestions.length > 1 ? "s" : ""}</Text>
          </View>
          {cookTimeLabel && (
            <>
              <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 4 }} />
              <View style={{ alignItems: "center", gap: 2 }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>{cookTimeLabel}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>cuisine</Text>
              </View>
            </>
          )}
        </View>
        <Pressable
          onPress={handleValidate}
          style={({ pressed }) => ({
            borderRadius: 16, backgroundColor: pressed ? colors.accentPress : colors.accent,
            paddingVertical: 18, alignItems: "center",
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>Valider le batch cooking</Text>
        </Pressable>
      </View>

      {/* Catalogue swap */}
      <BottomModal isOpen={catalogOpen} onClose={() => setCatalogOpen(false)} height="auto">
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text, marginBottom: 4 }}>
            {isAdding ? "Ajouter un plat" : "Changer de recette"}
          </Text>
          {!isAdding && swapIndex !== null && suggestions[swapIndex] && (
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }} numberOfLines={1}>
              Remplace : {suggestions[swapIndex].recipe.name}
            </Text>
          )}

          {/* Tags filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16, marginHorizontal: -20 }}
            contentContainerStyle={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20 }}
          >
            {(["rapide", "legere", "proteinee", "gourmande", "vegetarienne"] as BatchCookingTag[]).map((tag) => {
              const isActive = activeTag === tag;
              return (
                <Pressable
                  key={tag}
                  onPress={() => setActiveTag(isActive ? null : tag)}
                  style={{
                    borderRadius: 99, paddingHorizontal: 14, height: 34,
                    backgroundColor: isActive ? colors.accent : colors.bgSurface,
                    marginRight: 8,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? "#fff" : colors.textMuted }}>
                    {TAG_LABELS[tag]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <BottomModalScrollView>
            <View style={{ gap: 10 }}>
              {availableCatalog.length === 0 ? (
                <Text style={{ color: colors.textSubtle, textAlign: "center", marginTop: 32, fontSize: 14 }}>
                  Aucune recette dans cette catégorie
                </Text>
              ) : (
                availableCatalog.map((recipe) => (
                  <Pressable
                    key={recipe.id}
                    onPress={() => isAdding ? addRecipe(recipe) : openPreview(recipe)}
                    style={({ pressed }) => ({
                      flexDirection: "row", alignItems: "center", gap: 12,
                      backgroundColor: pressed ? colors.accentBg : colors.bgSurface,
                      borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
                    })}
                  >
                    {recipe.imageUrl ? (
                      <ImageWithFallback uri={recipe.imageUrl} size={52} name={recipe.name} />
                    ) : (
                      <ImagePlaceholder size={52} name={recipe.name} />
                    )}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }} numberOfLines={1}>{recipe.name}</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                        {recipe.batchCookingTags.slice(0, 2).map((tag) => {
                          const style = TAG_COLORS[tag] ?? { bg: colors.bgSurface, text: colors.textMuted };
                          return (
                            <View key={tag} style={{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: style.bg }}>
                              <Text style={{ fontSize: 11, fontWeight: "600", color: style.text }}>{TAG_LABELS[tag]}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.border} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M9 18l6-6-6-6" />
                    </Svg>
                  </Pressable>
                ))
              )}
            </View>
          </BottomModalScrollView>
        </View>
      </BottomModal>
    </SafeAreaView>
  );
}

const LOADING_MESSAGES = [
  "Nous sélectionnons les meilleures recettes…",
  "On vérifie la diversité des saveurs…",
  "On optimise pour ta semaine…",
  "Presque prêt !",
];

function LoadingScreen() {
  const { colors } = useAppTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(1)).current;
  const [msgIndex, setMsgIndex] = useState(0);
  const msgOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0.85,
      duration: 2800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(emojiScale, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(emojiScale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const interval = setInterval(() => {
      Animated.timing(msgOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        Animated.timing(msgOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      });
    }, 1800);

    return () => { clearInterval(interval); pulse.stop(); };
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.accent }} edges={["top", "bottom"]}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 24, paddingHorizontal: 40 }}>
        <Animated.Text style={{ fontSize: 52, transform: [{ scale: emojiScale }] }}>🍱</Animated.Text>
        <Animated.Text style={{ fontSize: 17, fontWeight: "700", color: "#fff", textAlign: "center", opacity: msgOpacity, lineHeight: 26 }}>
          {LOADING_MESSAGES[msgIndex]}
        </Animated.Text>
        <View style={{ width: 200, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)" }}>
          <Animated.View style={{ width: barWidth, height: 5, borderRadius: 3, backgroundColor: "#fff" }} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function GeneratingScreen() {
  const { colors } = useAppTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.accent }} edges={["top", "bottom"]}>
      <Animated.View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 40, opacity, transform: [{ translateY }] }}>
        <Text style={{ fontSize: 42, fontWeight: "900", color: "#fff", textAlign: "center", letterSpacing: -1 }}>C'est validé !</Text>
        <Text style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 24 }}>
          Ton planning de la semaine est en cours de génération…
        </Text>
        <ActivityIndicator color="#fff" size="large" style={{ marginTop: 8 }} />
      </Animated.View>
    </SafeAreaView>
  );
}

const PLACEHOLDER_COLORS = ["#E8571C", "#16A34A", "#0284C7", "#7C3AED", "#0D9488", "#CA8A04"];
function nameColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PLACEHOLDER_COLORS[Math.abs(h) % PLACEHOLDER_COLORS.length];
}

function ImagePlaceholder({ size, name }: { size: number; name: string }) {
  const color = nameColor(name);
  return (
    <View style={{ width: size, height: size, borderRadius: 10, backgroundColor: color + "18", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.38, fontWeight: "800", color }}>{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

function ImageWithFallback({ uri, size, name }: { uri: string; size: number; name: string }) {
  const [error, setError] = useState(false);
  if (error) return <ImagePlaceholder size={size} name={name} />;
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: 10 }}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  );
}

function RecipeCard({ suggestion, onSwap, onRemove, onPortionsChange, colors, index }: {
  suggestion: BatchRecipeSuggestion;
  onSwap: () => void;
  onRemove?: () => void;
  onPortionsChange: (delta: number) => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
  index: number;
}) {
  const { recipe, portions } = suggestion;
  const hasConso = (recipe.fridgeDays != null && recipe.fridgeDays > 0) || (recipe.freezerMonths != null && recipe.freezerMonths > 0);
  const portionScale = useSharedValue(1);
  const portionAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: portionScale.value }] }));

  function handlePortionsChange(delta: number) {
    portionScale.value = withSequence(withSpring(1.3), withSpring(1));
    onPortionsChange(delta);
  }

  return (
    <ReanimatedAnimated.View
      entering={FadeInDown.delay(index * 80).springify()}
      exiting={FadeOutLeft.springify()}
      layout={Layout.springify()}
      style={{ backgroundColor: colors.bgCard, borderRadius: 16, marginBottom: 10, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}
    >
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={{ position: "absolute", top: 10, right: 10, zIndex: 1, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M18 6L6 18M6 6l12 12" />
          </Svg>
        </Pressable>
      )}
      {/* Top row: thumbnail + info */}
      <View style={{ flexDirection: "row", padding: 12, gap: 12, alignItems: "center" }}>
        {recipe.imageUrl ? (
          <ImageWithFallback uri={recipe.imageUrl} size={72} name={recipe.name} />
        ) : (
          <ImagePlaceholder size={72} name={recipe.name} />
        )}
        <View style={{ flex: 1, gap: 5, paddingRight: onRemove ? 22 : 0 }}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text, letterSpacing: -0.2 }} numberOfLines={2}>{recipe.name}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {recipe.batchCookingTags.slice(0, 2).map((tag) => {
              const s = TAG_COLORS[tag] ?? { bg: colors.bgSurface, text: colors.textMuted };
              return (
                <View key={tag} style={{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: s.bg }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: s.text }}>{TAG_LABELS[tag]}</Text>
                </View>
              );
            })}
            {hasConso && (
              <View style={{ flexDirection: "row", gap: 4 }}>
                {recipe.fridgeDays != null && recipe.fridgeDays > 0 && (
                  <Text style={{ fontSize: 11, color: colors.textSubtle }}>🧊 {recipe.fridgeDays}j</Text>
                )}
                {recipe.freezerMonths != null && recipe.freezerMonths > 0 && (
                  <Text style={{ fontSize: 11, color: colors.textSubtle }}>❄️ {recipe.freezerMonths}m</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Bottom row: swap + portions */}
      <View style={{ flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: colors.border }}>
        <Pressable
          onPress={onSwap}
          style={({ pressed }) => ({
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            paddingVertical: 11,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M1 4v6h6" /><Path d="M23 20v-6h-6" />
            <Path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </Svg>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>Changer</Text>
        </Pressable>

        <View style={{ width: 1, height: 32, backgroundColor: colors.border }} />

        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 8 }}>
          <Pressable onPress={() => handlePortionsChange(-1)} style={{ width: 36, height: 40, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "600", color: colors.textMuted }}>−</Text>
          </Pressable>
          <ReanimatedAnimated.View style={[{ minWidth: 28, alignItems: "center" }, portionAnimatedStyle]}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>{portions}</Text>
            <Text style={{ fontSize: 9, color: colors.textSubtle }}>repas</Text>
          </ReanimatedAnimated.View>
          <Pressable onPress={() => handlePortionsChange(1)} style={{ width: 36, height: 40, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "600", color: colors.accent }}>+</Text>
          </Pressable>
        </View>
      </View>
    </ReanimatedAnimated.View>
  );
}
