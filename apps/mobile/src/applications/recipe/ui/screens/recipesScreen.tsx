import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BottomSheet, Button, Card, Chip, PressableFeedback, SearchField } from "heroui-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polygon, Polyline } from "react-native-svg";
import { useRecipes } from "../../api/useRecipes";
import type { Recipe } from "../../domain/entities/recipe";

const DIETARY_LABELS: Record<string, string> = {
  vegetarian: "Végétarien",
  vegan: "Vegan",
  gluten_free: "Sans gluten",
  lactose_free: "Sans lait",
  halal: "Halal",
  kosher: "Casher",
  no_pork: "Sans porc",
  no_seafood: "Sans mer",
};

const PALETTES = [
  { bg: "#FFF7ED", accent: "#EA580C", text: "#9A3412" },
  { bg: "#FEF3C7", accent: "#D97706", text: "#92400E" },
  { bg: "#FDF2F8", accent: "#C026D3", text: "#701A75" },
  { bg: "#EFF6FF", accent: "#2563EB", text: "#1E3A8A" },
  { bg: "#F0FDF4", accent: "#16A34A", text: "#14532D" },
  { bg: "#FFF1F2", accent: "#E11D48", text: "#881337" },
];

function paletteFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

function fmtTime(min: number) {
  if (min < 60) return `${min}mn`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

type SortOption = "recent" | "fast" | "slow";
type QuickFilter = "favorites" | null;

function HeroCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
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

function ThumbCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
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

function GridCard({ recipe, onPress, matchRatio }: { recipe: Recipe; onPress: () => void; matchRatio?: number }) {
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
        {matchRatio !== undefined && (
          <View style={{
            position: "absolute", top: 10, left: 10,
            flexDirection: "row", alignItems: "center", gap: 4,
            borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4,
            backgroundColor: matchRatio > 0 ? "#f59e0b" : "rgba(0,0,0,0.35)",
          }}>
            <Text style={{ fontSize: 9, fontWeight: "700", color: "#fff" }}>{Math.round(matchRatio * 100)}%</Text>
          </View>
        )}

        <View style={{
          paddingHorizontal: 12, paddingBottom: 12, paddingTop: 40,
        }}>
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

function ListCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
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
          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: "#1C1917" }}>{recipe.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {totalTime > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx={12} cy={12} r={10} />
                  <Polyline points="12 6 12 12 16 14" />
                </Svg>
                <Text style={{ fontSize: 11, color: "#78716C" }}>{fmtTime(totalTime)}</Text>
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
            <Text numberOfLines={1} style={{ fontSize: 11, color: "#78716C99" }}>{recipe.description}</Text>
          ) : null}
        </View>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E40" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="9 18 15 12 9 6" />
        </Svg>
      </PressableFeedback>
    </Card>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: "700", color: "#78716C99", textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 10, paddingHorizontal: 16 }}>
      {label}
    </Text>
  );
}

export function RecipesScreen() {
  const router = useRouter();
  const { recipes, loading } = useRecipes();
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState("any");
  const [sort, setSort] = useState<SortOption>("recent");
  const [filterOpen, setFilterOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const r of recipes) r.dietaryTags.forEach((t) => tags.add(t));
    return [...tags];
  }, [recipes]);

  const activeFilterCount = activeTags.length + (timeFilter !== "any" ? 1 : 0) + (sort !== "recent" ? 1 : 0);
  const isSearching = search.trim() !== "";
  const isFiltering = isSearching || activeTags.length > 0 || timeFilter !== "any" || sort !== "recent" || quickFilter !== null;

  const filtered = useMemo(() => {
    let result = recipes;
    if (search.trim()) {
      const q = normalize(search);
      result = result.filter((r) => normalize(r.name).includes(q) || normalize(r.description ?? "").includes(q));
    }
    if (activeTags.length > 0) {
      result = result.filter((r) => activeTags.every((t) => r.dietaryTags.includes(t)));
    }
    if (timeFilter === "quick") {
      result = result.filter((r) => { const t = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0); return t > 0 && t <= 30; });
    } else if (timeFilter === "medium") {
      result = result.filter((r) => { const t = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0); return t > 0 && t <= 60; });
    }
    if (quickFilter === "favorites") {
      result = result.filter((r) => r.isFavorite);
    }
    return [...result].sort((a, b) => {
      if (sort === "recent") return +new Date(b.createdAt) - +new Date(a.createdAt);
      const ta = (a.prepTimeMinutes ?? 0) + (a.cookTimeMinutes ?? 0);
      const tb = (b.prepTimeMinutes ?? 0) + (b.cookTimeMinutes ?? 0);
      return sort === "fast" ? ta - tb : tb - ta;
    });
  }, [recipes, search, activeTags, timeFilter, sort, quickFilter]);

  const sections = useMemo(() => {
    if (isFiltering) return null;
    const result: { label: string; items: Recipe[] }[] = [];
    const quick = recipes.filter((r) => {
      const t = (r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0);
      return t > 0 && t <= 30;
    });
    if (quick.length > 0) result.push({ label: "Rapides · moins de 30 min", items: quick });
    return result;
  }, [recipes, isFiltering]);

  const heroRecipe = !isFiltering && recipes.length > 0 ? recipes[0] : null;
  const gridRecipes = !isFiltering ? recipes.slice(1) : [];

  function toggleTag(tag: string) {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  function clearFilters() {
    setSearch(""); setActiveTags([]); setTimeFilter("any"); setSort("recent"); setQuickFilter(null);
  }

  function goToRecipe(id: string) {
    router.push({ pathname: "/recipe/[id]", params: { id } });
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#E8571C" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6" }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#1C1917", letterSpacing: -0.5, marginBottom: 16 }}>Recettes</Text>

          {/* Search row */}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <SearchField value={search} onChange={setSearch}>
                <SearchField.Group className="rounded-2xl">
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Rechercher…" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
            </View>
            <Pressable
              onPress={() => setFilterOpen(true)}
              style={{
                width: 48, height: 48, borderRadius: 16,
                alignItems: "center", justifyContent: "center",
                backgroundColor: activeFilterCount > 0 ? "#E8571C" : "#fff",
                shadowColor: "#1C1917", shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
              }}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={activeFilterCount > 0 ? "#fff" : "#78716C"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Line x1={4} y1={6} x2={20} y2={6} />
                <Line x1={8} y1={12} x2={16} y2={12} />
                <Line x1={11} y1={18} x2={13} y2={18} />
              </Svg>
              {activeFilterCount > 0 && (
                <View style={{
                  position: "absolute", top: -4, right: -4,
                  width: 16, height: 16, borderRadius: 8,
                  backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
                  shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
                }}>
                  <Text style={{ fontSize: 9, fontWeight: "900", color: "#E8571C" }}>{activeFilterCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Quick filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }} contentContainerStyle={{ gap: 6 }}>
            <Chip
              variant={quickFilter === "favorites" ? "primary" : "secondary"}
              color={quickFilter === "favorites" ? "danger" : "default"}
              onPress={() => setQuickFilter((q) => q === "favorites" ? null : "favorites")}
            >
              <Chip.Label>❤️ Favoris</Chip.Label>
            </Chip>
            {activeTags.map((tag) => (
              <Chip key={tag} variant="primary" color="accent" onPress={() => toggleTag(tag)}>
                <Chip.Label>{DIETARY_LABELS[tag] ?? tag} ×</Chip.Label>
              </Chip>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        {isFiltering ? (
          <View style={{ paddingHorizontal: 16, gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#78716C" }}>
                {filtered.length} recette{filtered.length !== 1 ? "s" : ""}
              </Text>
              <Pressable onPress={clearFilters}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#E8571C" }}>Effacer tout</Text>
              </Pressable>
            </View>
            {filtered.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 64 }}>
                <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: "#F5F3EF", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <Circle cx={11} cy={11} r={8} />
                    <Line x1={21} y1={21} x2={16.65} y2={16.65} />
                  </Svg>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1917", marginBottom: 8 }}>Aucune recette trouvée</Text>
                <Pressable onPress={clearFilters}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#E8571C" }}>Effacer les filtres</Text>
                </Pressable>
              </View>
            ) : isSearching ? (
              <View style={{ gap: 8 }}>
                {filtered.map((recipe) => (
                  <ListCard key={recipe.id} recipe={recipe} onPress={() => goToRecipe(recipe.id)} />
                ))}
              </View>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {filtered.map((recipe, i) => (
                  <View key={recipe.id} style={{ width: "47%" }}>
                    <GridCard recipe={recipe} onPress={() => goToRecipe(recipe.id)} />
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <>
            {recipes.length === 0 ? (
              <View style={{ alignItems: "center", paddingTop: 64, paddingHorizontal: 32 }}>
                <Text style={{ fontSize: 40, marginBottom: 16 }}>🍽️</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#1C1917", marginBottom: 8, textAlign: "center" }}>Aucune recette</Text>
                <Text style={{ fontSize: 14, color: "#78716C", textAlign: "center" }}>Ajoutez vos premières recettes en appuyant sur +.</Text>
              </View>
            ) : (
              <>
                {heroRecipe && (
                  <View style={{ marginBottom: 20 }}>
                    <HeroCard recipe={heroRecipe} onPress={() => goToRecipe(heroRecipe.id)} />
                  </View>
                )}

                {sections && sections.map((section) => (
                  <View key={section.label} style={{ marginBottom: 20 }}>
                    <SectionLabel label={section.label} />
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                      {section.items.map((recipe) => (
                        <ThumbCard key={recipe.id} recipe={recipe} onPress={() => goToRecipe(recipe.id)} />
                      ))}
                    </ScrollView>
                  </View>
                ))}

                {gridRecipes.length > 0 && (
                  <View style={{ marginBottom: 20 }}>
                    <SectionLabel label="Toutes les recettes" />
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 }}>
                      {gridRecipes.map((recipe) => (
                        <View key={recipe.id} style={{ width: "47%" }}>
                          <GridCard recipe={recipe} onPress={() => goToRecipe(recipe.id)} />
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/recipe/new" as never)}
        style={({ pressed }) => ({
          position: "absolute", bottom: 100, right: 20,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: "#E8571C",
          alignItems: "center", justifyContent: "center",
          shadowColor: "#E8571C", shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        })}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Line x1={12} y1={5} x2={12} y2={19} />
          <Line x1={5} y1={12} x2={19} y2={12} />
        </Svg>
      </Pressable>

      {/* Filter BottomSheet */}
      <BottomSheet isOpen={filterOpen} onOpenChange={setFilterOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["75%"]}>
            <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Filtres</Text>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                {(activeTags.length > 0 || timeFilter !== "any" || sort !== "recent") && (
                  <Pressable onPress={() => { setActiveTags([]); setTimeFilter("any"); setSort("recent"); }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#E8571C" }}>Tout effacer</Text>
                  </Pressable>
                )}
                <BottomSheet.Close />
              </View>
            </View>

            <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
              {allTags.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#78716C99", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Régime</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {allTags.map((tag) => (
                      <Pressable
                        key={tag}
                        onPress={() => toggleTag(tag)}
                        style={{
                          borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8,
                          backgroundColor: activeTags.includes(tag) ? "#E8571C" : "#F5F3EF",
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "700", color: activeTags.includes(tag) ? "#fff" : "#78716C" }}>
                          {DIETARY_LABELS[tag] ?? tag}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#78716C99", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Temps total</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[["any", "Tout"], ["quick", "≤ 30 min"], ["medium", "≤ 60 min"]].map(([val, label]) => (
                    <Pressable
                      key={val}
                      onPress={() => setTimeFilter(val)}
                      style={{
                        flex: 1, borderRadius: 16, paddingVertical: 10,
                        alignItems: "center",
                        backgroundColor: timeFilter === val ? "#E8571C" : "#F5F3EF",
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "700", color: timeFilter === val ? "#fff" : "#78716C" }}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#78716C99", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Trier par</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {([["recent", "Plus récent"], ["fast", "Plus rapide"], ["slow", "Plus long"]] as [SortOption, string][]).map(([val, label]) => (
                    <Pressable
                      key={val}
                      onPress={() => setSort(val)}
                      style={{
                        flex: 1, borderRadius: 16, paddingVertical: 10,
                        alignItems: "center",
                        backgroundColor: sort === val ? "#E8571C" : "#F5F3EF",
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "700", color: sort === val ? "#fff" : "#78716C" }}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Button variant="primary" className="w-full rounded-2xl" onPress={() => setFilterOpen(false)}>
                <Button.Label>Appliquer</Button.Label>
              </Button>
            </BottomSheetScrollView>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </SafeAreaView>
  );
}
