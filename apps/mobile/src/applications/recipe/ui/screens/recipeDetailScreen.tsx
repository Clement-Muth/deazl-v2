import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { BottomSheet, Button, PressableFeedback, SearchField } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from "react-native-svg";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { deleteRecipe } from "../../application/useCases/deleteRecipe";
import { getRecipeById } from "../../application/useCases/getRecipeById";
import { scheduleRecipe } from "../../../planning/application/useCases/scheduleRecipe";
import type { MealType } from "../../../planning/domain/entities/planning";
import { linkProductToIngredient } from "../../application/useCases/linkProductToIngredient";
import { searchProducts } from "../../application/useCases/searchProducts";
import { toggleFavorite } from "../../application/useCases/toggleFavorite";
import type { CatalogProduct, Recipe, RecipeIngredient } from "../../domain/entities/recipe";

const HERO_HEIGHT = 420;

const PALETTES: [string, string][] = [
  ["#E8571C", "#FF8C42"],
  ["#16A34A", "#4ADE80"],
  ["#7C3AED", "#A78BFA"],
  ["#0284C7", "#38BDF8"],
  ["#E11D48", "#FB7185"],
  ["#0D9488", "#2DD4BF"],
];

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

function fmtQty(qty: number, multiplier: number): string {
  const v = qty * multiplier;
  if (v === Math.floor(v)) return String(Math.floor(v));
  return v.toFixed(1).replace(/\.0$/, "");
}

interface RecipeDetailScreenProps {
  id: string;
  onBack: () => void;
  onEdit?: (id: string) => void;
  onDelete?: () => void;
}

export function RecipeDetailScreen({ id, onBack, onEdit, onDelete }: RecipeDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [servings, setServings] = useState(4);
  const [cookModeOpen, setCookModeOpen] = useState(false);
  const [cookStep, setCookStep] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [linkingIngredient, setLinkingIngredient] = useState<RecipeIngredient | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<CatalogProduct[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    getRecipeById(id).then((r) => {
      setRecipe(r);
      if (r) {
        setIsFavorite(r.isFavorite);
        setServings(r.servings);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleToggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavorite(id, next);
  }

  function toggleIngredient(ingredientId: string) {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openLinkSheet(ing: RecipeIngredient) {
    setLinkingIngredient(ing);
    setProductSearch("");
    setProductResults([]);
  }

  function closeLinkSheet() {
    setLinkingIngredient(null);
    setProductSearch("");
    setProductResults([]);
  }

  async function handleProductSearch(q: string) {
    setProductSearch(q);
    if (!q.trim()) { setProductResults([]); return; }
    setProductSearching(true);
    const results = await searchProducts(q);
    setProductResults(results);
    setProductSearching(false);
  }

  async function handleLinkProduct(product: CatalogProduct) {
    if (!linkingIngredient || !recipe) return;
    await linkProductToIngredient(linkingIngredient.id, product.id);
    setRecipe(prev => prev ? {
      ...prev,
      ingredients: prev.ingredients.map(i =>
        i.id === linkingIngredient.id ? { ...i, productId: product.id, productName: product.name } : i
      ),
    } : prev);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeLinkSheet();
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteRecipe(id);
    setDeleting(false);
    setConfirmDelete(false);
    onDelete?.();
  }

  async function handleUnlinkProduct() {
    if (!linkingIngredient || !recipe) return;
    await linkProductToIngredient(linkingIngredient.id, null);
    setRecipe(prev => prev ? {
      ...prev,
      ingredients: prev.ingredients.map(i =>
        i.id === linkingIngredient.id ? { ...i, productId: null, productName: null } : i
      ),
    } : prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    closeLinkSheet();
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFAF5", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#E8571C" size="large" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFAF5", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "#78716C" }}>Recette introuvable.</Text>
      </View>
    );
  }

  const [palFrom, palTo] = paletteForName(recipe.name);
  const hasImg = !!recipe.imageUrl;
  const multiplier = recipe.servings > 0 ? servings / recipe.servings : 1;
  const prepTime = recipe.prepTimeMinutes ?? 0;
  const cookTime = recipe.cookTimeMinutes ?? 0;
  const hasStats = prepTime > 0 || cookTime > 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFAF5" }}>
      {/* Sticky compact header — fades in after scrolling past hero */}
      <Animated.View
        style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
          opacity: headerOpacity,
          backgroundColor: "#FFFAF5",
          borderBottomWidth: 1, borderBottomColor: "#F0EDEA",
          paddingTop: insets.top,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
          <PressableFeedback
            onPress={onBack}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#F5F3EF", alignItems: "center", justifyContent: "center" }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="15 18 9 12 15 6" />
            </Svg>
          </PressableFeedback>
          <Text style={{ flex: 1, fontSize: 15, fontWeight: "700", color: "#1C1917" }} numberOfLines={1}>{recipe.name}</Text>
          <PressableFeedback
            onPress={handleToggleFavorite}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#F5F3EF", alignItems: "center", justifyContent: "center" }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill={isFavorite ? "#E8571C" : "none"} stroke={isFavorite ? "#E8571C" : "#1C1917"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </Svg>
          </PressableFeedback>
        </View>
      </Animated.View>

      {/* Main scrollable content */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Hero */}
        <View style={{ height: HERO_HEIGHT }}>
          {hasImg ? (
            <Image
              source={{ uri: recipe.imageUrl! }}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[palFrom, palTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.78)"]}
            locations={[0, 0.38, 1]}
            style={{ position: "absolute", inset: 0 }}
          />

          {!hasImg && (
            <Text style={{ position: "absolute", right: 16, top: "12%", fontSize: 210, fontWeight: "900", color: "#fff", opacity: 0.08, lineHeight: 210 }}>
              {recipe.name.trim().charAt(0).toUpperCase()}
            </Text>
          )}

          {/* Floating nav buttons */}
          <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8 }}>
              <Pressable
                onPress={onBack}
                style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="15 18 9 12 15 6" />
                </Svg>
              </Pressable>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={handleToggleFavorite}
                  style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill={isFavorite ? "#E8571C" : "none"} stroke={isFavorite ? "#E8571C" : "#1C1917"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </Svg>
                </Pressable>
                <Pressable
                  onPress={() => setActionsOpen(true)}
                  style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Circle cx={12} cy={5} r={1} fill="#1C1917" />
                    <Circle cx={12} cy={12} r={1} fill="#1C1917" />
                    <Circle cx={12} cy={19} r={1} fill="#1C1917" />
                  </Svg>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>

          {/* Hero title + meta — fades out on scroll */}
          <Animated.View style={{ position: "absolute", bottom: 88, left: 20, right: 20, opacity: heroContentOpacity }}>
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                  <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <Circle cx={9} cy={7} r={4} />
                </Svg>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>{recipe.servings} pers.</Text>
              </View>
              {recipe.ingredients.length > 0 && (
                <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>{recipe.ingredients.length} ingrédients</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* White content card — overlaps hero slightly */}
        <View style={{ marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: "#FFFAF5", overflow: "hidden" }}>

          {/* Stats strip */}
          {hasStats && (
            <>
              <View style={{ flexDirection: "row", paddingTop: 24, paddingBottom: 20 }}>
                {prepTime > 0 && (
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ fontSize: 22, fontWeight: "900", color: "#1C1917" }}>{fmtTime(prepTime)}</Text>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: "#A8A29E", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.8 }}>Préparation</Text>
                  </View>
                )}
                {prepTime > 0 && cookTime > 0 && <View style={{ width: 1, backgroundColor: "#E8E5E0", marginVertical: 4 }} />}
                {cookTime > 0 && (
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ fontSize: 22, fontWeight: "900", color: "#1C1917" }}>{fmtTime(cookTime)}</Text>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: "#A8A29E", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.8 }}>Cuisson</Text>
                  </View>
                )}
                {(prepTime > 0 || cookTime > 0) && <View style={{ width: 1, backgroundColor: "#E8E5E0", marginVertical: 4 }} />}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 22, fontWeight: "900", color: "#1C1917" }}>{recipe.servings}</Text>
                  <Text style={{ fontSize: 10, fontWeight: "600", color: "#A8A29E", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.8 }}>Portions</Text>
                </View>
              </View>
              <View style={{ height: 1, backgroundColor: "#F0EDEA", marginHorizontal: 20 }} />
            </>
          )}

          {!hasStats && <View style={{ height: 24 }} />}

          {/* Description */}
          {recipe.description ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 }}>
              <Text style={{ fontSize: 15, color: "#57534E", lineHeight: 24 }}>{recipe.description}</Text>
              <View style={{ height: 1, backgroundColor: "#F0EDEA", marginTop: 20 }} />
            </View>
          ) : null}

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <View style={{ paddingTop: 28 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 1.5 }}>
                  Ingrédients
                </Text>
                {/* Inline servings adjuster */}
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F5F3EF", borderRadius: 12, overflow: "hidden" }}>
                  <Pressable
                    onPress={() => setServings(s => Math.max(1, s - 1))}
                    style={{ paddingHorizontal: 14, paddingVertical: 8 }}
                    hitSlop={8}
                  >
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2.5} strokeLinecap="round">
                      <Line x1={5} y1={12} x2={19} y2={12} />
                    </Svg>
                  </Pressable>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1917", minWidth: 38, textAlign: "center" }}>{servings} pers.</Text>
                  <Pressable
                    onPress={() => setServings(s => s + 1)}
                    style={{ paddingHorizontal: 14, paddingVertical: 8 }}
                    hitSlop={8}
                  >
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round">
                      <Line x1={12} y1={5} x2={12} y2={19} />
                      <Line x1={5} y1={12} x2={19} y2={12} />
                    </Svg>
                  </Pressable>
                </View>
              </View>

              <View style={{ paddingHorizontal: 20 }}>
                {recipe.ingredients.map((ing, i) => {
                  const isChecked = checkedIngredients.has(ing.id);
                  const displayName = ing.productName ?? ing.customName ?? "";
                  const isLinked = !!ing.productId;
                  return (
                    <View key={ing.id}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13 }}>
                        <Pressable onPress={() => toggleIngredient(ing.id)}>
                          <View style={{
                            width: 24, height: 24, borderRadius: 12,
                            borderWidth: 2,
                            borderColor: isChecked ? "#E8571C" : "#D6D3D1",
                            backgroundColor: isChecked ? "#E8571C" : "transparent",
                            alignItems: "center", justifyContent: "center",
                          }}>
                            {isChecked && (
                              <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                                <Polyline points="20 6 9 17 4 12" />
                              </Svg>
                            )}
                          </View>
                        </Pressable>
                        <Pressable style={{ flex: 1 }} onPress={() => toggleIngredient(ing.id)}>
                          <Text style={{ fontSize: 15, color: isChecked ? "#B0AAA5" : "#1C1917", opacity: isChecked ? 0.55 : 1, textDecorationLine: isChecked ? "line-through" : "none" }}>
                            {ing.quantity > 0 ? (
                              <Text style={{ fontWeight: "700", color: isChecked ? "#B0AAA5" : "#E8571C" }}>
                                {fmtQty(ing.quantity, multiplier)}{ing.unit ? ` ${ing.unit}` : ""}{" "}
                              </Text>
                            ) : null}
                            {displayName}
                            {ing.isOptional ? <Text style={{ color: "#A8A29E", fontSize: 13 }}> (opt.)</Text> : null}
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => openLinkSheet(ing)}
                          style={{
                            width: 30, height: 30, borderRadius: 8,
                            backgroundColor: isLinked ? "#FFF7ED" : "#F5F3EF",
                            alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={isLinked ? "#E8571C" : "#A8A29E"} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </Svg>
                        </Pressable>
                      </View>
                      {i < recipe.ingredients.length - 1 && (
                        <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Steps — connected timeline layout */}
          {recipe.steps.length > 0 && (
            <View style={{ paddingTop: 36, paddingHorizontal: 20, paddingBottom: 28 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 24 }}>
                Préparation
              </Text>
              {recipe.steps.map((step, i) => (
                <View key={step.id} style={{ flexDirection: "row", gap: 16 }}>
                  {/* Step number + connector line */}
                  <View style={{ alignItems: "center", width: 36 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#E8571C", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 15, fontWeight: "900", color: "#fff" }}>{step.stepNumber}</Text>
                    </View>
                    {i < recipe.steps.length - 1 && (
                      <View style={{ width: 2, flex: 1, minHeight: 20, backgroundColor: "#FCDCC8", marginTop: 6 }} />
                    )}
                  </View>
                  {/* Step description */}
                  <View style={{ flex: 1, paddingBottom: i < recipe.steps.length - 1 ? 28 : 0, paddingTop: 7 }}>
                    <Text style={{ fontSize: 15, color: "#374151", lineHeight: 24 }}>
                      {step.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Bottom spacing for sticky button */}
          <View style={{ height: recipe.steps.length > 0 ? 100 : 40 }} />
        </View>
      </Animated.ScrollView>

      {/* Sticky Cook Mode button */}
      {recipe.steps.length > 0 && (
        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          backgroundColor: "#FFFAF5",
          borderTopWidth: 1, borderTopColor: "#F0EDEA",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
        }}>
          <Button
            variant="primary"
            className="w-full rounded-2xl"
            onPress={() => { setCookStep(0); setCookModeOpen(true); }}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Polygon points="5 3 19 12 5 21 5 3" />
            </Svg>
            <Button.Label>Mode Cuisine</Button.Label>
          </Button>
        </View>
      )}

      {/* Product linking BottomSheet */}
      <BottomSheet isOpen={linkingIngredient !== null} onOpenChange={open => !open && closeLinkSheet()}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["70%"]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 1.5 }}>Lier un produit</Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#1C1917", marginTop: 2 }} numberOfLines={1}>
                    {linkingIngredient?.productName ?? linkingIngredient?.customName ?? ""}
                  </Text>
                </View>
                <BottomSheet.Close />
              </View>

              {linkingIngredient?.productId && (
                <Pressable
                  onPress={handleUnlinkProduct}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", gap: 10,
                    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                    backgroundColor: "#FFF1F2", marginBottom: 12,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />
                    <Path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />
                    <Line x1={8} y1={2} x2={8} y2={5} />
                    <Line x1={2} y1={8} x2={5} y2={8} />
                    <Line x1={16} y1={19} x2={16} y2={22} />
                    <Line x1={19} y1={16} x2={22} y2={16} />
                  </Svg>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#E11D48" }}>Délier le produit actuel</Text>
                </Pressable>
              )}

              <SearchField value={productSearch} onChange={handleProductSearch}>
                <SearchField.Group className="rounded-2xl">
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Rechercher un produit…" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>

              <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}>
                {productSearching ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <ActivityIndicator color="#E8571C" />
                  </View>
                ) : productResults.length === 0 && productSearch.trim() ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <Text style={{ fontSize: 14, color: "#A8A29E" }}>Aucun produit trouvé</Text>
                  </View>
                ) : productResults.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <Text style={{ fontSize: 14, color: "#A8A29E" }}>Tapez un nom de produit pour rechercher</Text>
                  </View>
                ) : (
                  productResults.map(product => (
                    <Pressable
                      key={product.id}
                      onPress={() => handleLinkProduct(product)}
                      style={({ pressed }) => ({
                        flexDirection: "row", alignItems: "center", gap: 12,
                        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
                        backgroundColor: linkingIngredient?.productId === product.id ? "#FFF7ED" : pressed ? "#FAFAF9" : "transparent",
                        marginBottom: 2,
                      })}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", backgroundColor: "#F5F3EF", flexShrink: 0, alignItems: "center", justifyContent: "center" }}>
                        {product.imageUrl ? (
                          <Image source={{ uri: product.imageUrl }} style={{ width: 40, height: 40 }} resizeMode="contain" />
                        ) : (
                          <Text style={{ fontSize: 18 }}>🛒</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "600", color: linkingIngredient?.productId === product.id ? "#E8571C" : "#1C1917" }}>{product.name}</Text>
                        {product.brand && <Text numberOfLines={1} style={{ fontSize: 12, color: "#A8A29E", marginTop: 1 }}>{product.brand}</Text>}
                      </View>
                      {linkingIngredient?.productId === product.id && (
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M20 6 9 17l-5-5" />
                        </Svg>
                      )}
                    </Pressable>
                  ))
                )}
              </BottomSheetScrollView>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {/* Cook Mode BottomSheet */}
      <BottomSheet isOpen={cookModeOpen} onOpenChange={v => !v && setCookModeOpen(false)}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["88%"]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 1.5 }}>
                    Étape {cookStep + 1} / {recipe.steps.length}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#1C1917", marginTop: 2 }} numberOfLines={1}>{recipe.name}</Text>
                </View>
                <BottomSheet.Close />
              </View>

              {/* Progress bar */}
              <View style={{ height: 3, backgroundColor: "#F5F3EF", marginHorizontal: 20, borderRadius: 99 }}>
                <View style={{
                  height: 3, borderRadius: 99, backgroundColor: "#E8571C",
                  width: `${((cookStep + 1) / recipe.steps.length) * 100}%`,
                }} />
              </View>

              {/* Step content */}
              <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 36, paddingBottom: 20 }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 32, backgroundColor: "#E8571C",
                  alignItems: "center", justifyContent: "center", marginBottom: 28,
                }}>
                  <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff" }}>{recipe.steps[cookStep].stepNumber}</Text>
                </View>
                <Text style={{ fontSize: 20, color: "#1C1917", lineHeight: 32, fontWeight: "400", flex: 1 }}>
                  {recipe.steps[cookStep].description}
                </Text>
              </View>

              {/* Navigation */}
              <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 32 }}>
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  isDisabled={cookStep === 0}
                  onPress={() => setCookStep(s => s - 1)}
                >
                  <Button.Label>Précédent</Button.Label>
                </Button>
                {cookStep < recipe.steps.length - 1 ? (
                  <Button variant="primary" className="flex-1 rounded-2xl" onPress={() => setCookStep(s => s + 1)}>
                    <Button.Label>Suivant</Button.Label>
                  </Button>
                ) : (
                  <Button variant="primary" className="flex-1 rounded-2xl" onPress={() => setCookModeOpen(false)}>
                    <Button.Label>Terminé ✓</Button.Label>
                  </Button>
                )}
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <BottomSheet isOpen={actionsOpen} onOpenChange={(v) => !v && setActionsOpen(false)}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["38%"]}>
            <View style={{ paddingVertical: 8, gap: 4 }}>
              <Pressable
                onPress={() => { setActionsOpen(false); setScheduleOpen(true); }}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16, opacity: pressed ? 0.7 : 1 })}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
                  <Line x1={16} y1={2} x2={16} y2={6} />
                  <Line x1={8} y1={2} x2={8} y2={6} />
                  <Line x1={3} y1={10} x2={21} y2={10} />
                  <Path d="M8 14h.01M12 14h.01M16 14h.01" />
                </Svg>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#E8571C" }}>Planifier cette recette</Text>
              </Pressable>
              {onEdit && (
                <Pressable
                  onPress={() => { setActionsOpen(false); onEdit(id); }}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16, opacity: pressed ? 0.7 : 1 })}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </Svg>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#1C1917" }}>Modifier la recette</Text>
                </Pressable>
              )}
              {onDelete && (
                <Pressable
                  onPress={() => { setActionsOpen(false); setConfirmDelete(true); }}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16, opacity: pressed ? 0.7 : 1 })}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Polyline points="3 6 5 6 21 6" />
                    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <Path d="M10 11v6M14 11v6M9 6V4h6v2" />
                  </Svg>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#DC2626" }}>Supprimer la recette</Text>
                </Pressable>
              )}
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <ScheduleSheet
        recipeId={id}
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />

      <BottomSheet isOpen={confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(false)}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["32%"]}>
            <View style={{ alignItems: "center", paddingVertical: 16, gap: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Supprimer la recette ?</Text>
              <Text style={{ fontSize: 13, color: "#78716C", textAlign: "center" }}>Cette action est irréversible.</Text>
            </View>
            <View style={{ gap: 8 }}>
              <Button variant="ghost" onPress={handleDelete} isDisabled={deleting} className="w-full rounded-2xl">
                <Button.Label style={{ color: "#DC2626" }}>{deleting ? "Suppression…" : "Supprimer"}</Button.Label>
              </Button>
              <Button variant="secondary" onPress={() => setConfirmDelete(false)} className="w-full rounded-2xl">
                <Button.Label>Annuler</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
}

const MEAL_LABELS: Record<MealType, string> = { breakfast: "Petit-déjeuner", lunch: "Déjeuner", dinner: "Dîner" };
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getWeekDays(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function ScheduleSheet({ recipeId, isOpen, onClose }: { recipeId: string; isOpen: boolean; onClose: () => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDays = getWeekDays();
  const todayIdx = weekDays.findIndex((d) => d.getTime() === today.getTime());

  const [selectedDay, setSelectedDay] = useState(todayIdx >= 0 ? todayIdx : 0);
  const [selectedMeal, setSelectedMeal] = useState<MealType>("lunch");
  const [scheduling, setScheduling] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isOpen) { setDone(false); setSelectedDay(todayIdx >= 0 ? todayIdx : 0); setSelectedMeal("lunch"); }
  }, [isOpen]);

  async function handleSchedule() {
    setScheduling(true);
    await scheduleRecipe(recipeId, selectedDay + 1, selectedMeal);
    setScheduling(false);
    setDone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(onClose, 1200);
  }

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(v) => !v && onClose()}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["52%"]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#1C1917" }}>Planifier cette recette</Text>
            <BottomSheet.Close />
          </View>

          <View style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#78716C", textTransform: "uppercase", letterSpacing: 1 }}>Jour</Text>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {weekDays.map((day, i) => {
                  const isPast = day < today;
                  const isSelected = i === selectedDay;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => !isPast && setSelectedDay(i)}
                      style={{
                        flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center", gap: 2,
                        backgroundColor: isSelected ? "#E8571C" : isPast ? "#FAFAF8" : "#F5F3EF",
                        opacity: isPast ? 0.4 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: "700", color: isSelected ? "#fff" : "#A8A29E", textTransform: "uppercase" }}>
                        {DAY_LABELS[i]}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: isSelected ? "#fff" : "#1C1917" }}>
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#78716C", textTransform: "uppercase", letterSpacing: 1 }}>Repas</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {MEAL_TYPES.map((mt) => (
                  <Pressable
                    key={mt}
                    onPress={() => setSelectedMeal(mt)}
                    style={{
                      flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center",
                      backgroundColor: selectedMeal === mt ? "#E8571C" : "#F5F3EF",
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: selectedMeal === mt ? "#fff" : "#44403C" }}>
                      {MEAL_LABELS[mt]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={handleSchedule}
              disabled={scheduling || done}
              style={({ pressed }) => ({
                borderRadius: 16, paddingVertical: 16, alignItems: "center",
                backgroundColor: done ? "#16A34A" : pressed ? "#D14A18" : "#E8571C",
              })}
            >
              {scheduling ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>
                  {done ? "Planifié ✓" : "Planifier"}
                </Text>
              )}
            </Pressable>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
