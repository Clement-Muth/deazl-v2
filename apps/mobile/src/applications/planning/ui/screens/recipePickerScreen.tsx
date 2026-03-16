import { useFocusEffect } from "@react-navigation/native";
import { Button, SearchField } from "heroui-native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Path } from "react-native-svg";
import { useAppTheme } from "../../../../shared/theme";
import { BottomModal } from "../../../shopping/ui/components/bottomModal";
import { useRecipes } from "../../../recipe/api/useRecipes";
import { GridCard } from "../../../recipe/ui/components/gridCard";
import { ThumbCard } from "../../../recipe/ui/components/thumbCard";
import { DIETARY_LABELS } from "../../../recipe/ui/components/recipeUtils";
import { setMealSlot } from "../../application/useCases/setMealSlot";
import type { MealType } from "../../domain/entities/planning";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  dinner: "Dîner",
};

const GRID_CARD_WIDTH = (Dimensions.get("window").width - 32 - 12) / 2;

type SortOption = "recent" | "fast" | "slow";

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

interface Props {
  dayOfWeek: number;
  mealType: MealType;
  mealPlanId: string;
  date: Date;
  onBack: () => void;
  onDone: () => void;
}

export function RecipePickerScreen({ dayOfWeek, mealType, mealPlanId, date, onBack, onDone }: Props) {
  const { colors } = useAppTheme();
  const { recipes, loading, refetch } = useRecipes();
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState("any");
  const [sort, setSort] = useState<SortOption>("recent");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const r of recipes) r.dietaryTags.forEach((t) => tags.add(t));
    return [...tags];
  }, [recipes]);

  const activeFilterCount = activeTags.length + (timeFilter !== "any" ? 1 : 0) + (sort !== "recent" ? 1 : 0) + (favoritesOnly ? 1 : 0);
  const isFiltering = search.trim() !== "" || activeFilterCount > 0;

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
    if (favoritesOnly) result = result.filter((r) => r.isFavorite);
    return [...result].sort((a, b) => {
      if (sort === "recent") return +new Date(b.createdAt) - +new Date(a.createdAt);
      const ta = (a.prepTimeMinutes ?? 0) + (a.cookTimeMinutes ?? 0);
      const tb = (b.prepTimeMinutes ?? 0) + (b.cookTimeMinutes ?? 0);
      return sort === "fast" ? ta - tb : tb - ta;
    });
  }, [recipes, search, activeTags, timeFilter, sort, favoritesOnly]);

  const favorites = useMemo(() => recipes.filter((r) => r.isFavorite), [recipes]);
  const others = useMemo(() => {
    const favIds = new Set(favorites.map((r) => r.id));
    return recipes.filter((r) => !favIds.has(r.id));
  }, [recipes, favorites]);

  const dateLabel = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  function clearFilters() {
    setActiveTags([]); setTimeFilter("any"); setSort("recent"); setFavoritesOnly(false);
  }

  function toggleTag(tag: string) {
    setActiveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function handleSelect(recipeId: string) {
    setSaving(true);
    try {
      await setMealSlot(mealPlanId, dayOfWeek, mealType, recipeId);
    } catch {
      setSaving(false);
      return;
    }
    onDone();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      {saving && (
        <View style={{ position: "absolute", inset: 0, zIndex: 99, backgroundColor: colors.bg + "cc", alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      )}

      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <Pressable onPress={onBack} style={{ marginBottom: 16, alignSelf: "flex-start" }} hitSlop={10}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 5l-7 7 7 7" />
            </Svg>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSubtle }}>Retour</Text>
          </View>
        </Pressable>

        <Text style={{ fontSize: 24, fontWeight: "900", color: colors.text, letterSpacing: -0.5, marginBottom: 2 }}>
          {MEAL_LABELS[mealType]}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16, textTransform: "capitalize" }}>
          {dateLabel}
        </Text>

        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <SearchField value={search} onChange={setSearch}>
              <SearchField.Group className="rounded-2xl">
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Rechercher une recette…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </View>
          <Pressable
            onPress={() => setFilterOpen(true)}
            style={{
              width: 48, height: 48, borderRadius: 16,
              alignItems: "center", justifyContent: "center",
              backgroundColor: activeFilterCount > 0 ? colors.accent : colors.bgCard,
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
                backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center",
                shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
              }}>
                <Text style={{ fontSize: 9, fontWeight: "900", color: colors.accent }}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : recipes.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 8, textAlign: "center" }}>Aucune recette</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center" }}>Ajoutez des recettes depuis l'onglet Recettes.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {isFiltering ? (
            <View style={{ paddingHorizontal: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textMuted }}>
                  {filtered.length} recette{filtered.length !== 1 ? "s" : ""}
                </Text>
                {activeFilterCount > 0 && (
                  <Pressable onPress={clearFilters}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>Effacer tout</Text>
                  </Pressable>
                )}
              </View>
              {filtered.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 48 }}>
                  <Text style={{ fontSize: 14, color: colors.textSubtle }}>Aucune recette trouvée</Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {filtered.map((recipe) => (
                    <View key={recipe.id} style={{ width: GRID_CARD_WIDTH }}>
                      <GridCard recipe={recipe} onPress={() => handleSelect(recipe.id)} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <>
              {favorites.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted + "99", textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 10, paddingHorizontal: 16 }}>
                    Favoris
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: -8 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 12 }}>
                    {favorites.map((recipe) => (
                      <ThumbCard key={recipe.id} recipe={recipe} onPress={() => handleSelect(recipe.id)} />
                    ))}
                  </ScrollView>
                </View>
              )}

              {others.length > 0 && (
                <View>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted + "99", textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 10, paddingHorizontal: 16 }}>
                    {favorites.length > 0 ? "Toutes les recettes" : "Recettes"}
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 }}>
                    {others.map((recipe) => (
                      <View key={recipe.id} style={{ width: GRID_CARD_WIDTH }}>
                        <GridCard recipe={recipe} onPress={() => handleSelect(recipe.id)} />
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      <BottomModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} height="auto">
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text }}>Filtres</Text>
          {activeFilterCount > 0 && (
            <Pressable onPress={clearFilters}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>Tout effacer</Text>
            </Pressable>
          )}
        </View>

        <View style={{ paddingBottom: 8 }}>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted + "99", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Favoris</Text>
            <Pressable
              onPress={() => setFavoritesOnly((v) => !v)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 8,
                borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
                backgroundColor: favoritesOnly ? colors.accent : colors.bgSurface,
                alignSelf: "flex-start",
              }}
            >
              <Svg width={12} height={12} viewBox="0 0 24 24" fill={favoritesOnly ? "#fff" : "#78716C"} stroke="none">
                <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </Svg>
              <Text style={{ fontSize: 12, fontWeight: "700", color: favoritesOnly ? "#fff" : colors.textMuted }}>
                Favoris uniquement
              </Text>
            </Pressable>
          </View>

          {allTags.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted + "99", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Régime</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {allTags.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={{
                      borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8,
                      backgroundColor: activeTags.includes(tag) ? colors.accent : colors.bgSurface,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: activeTags.includes(tag) ? "#fff" : colors.textMuted }}>
                      {DIETARY_LABELS[tag] ?? tag}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted + "99", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Temps total</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[["any", "Tout"], ["quick", "≤ 30 min"], ["medium", "≤ 60 min"]].map(([val, label]) => (
                <Pressable
                  key={val}
                  onPress={() => setTimeFilter(val)}
                  style={{
                    flex: 1, borderRadius: 16, paddingVertical: 10,
                    alignItems: "center",
                    backgroundColor: timeFilter === val ? colors.accent : colors.bgSurface,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: timeFilter === val ? "#fff" : colors.textMuted }}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted + "99", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Trier par</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {([["recent", "Plus récent"], ["fast", "Plus rapide"], ["slow", "Plus long"]] as [SortOption, string][]).map(([val, label]) => (
                <Pressable
                  key={val}
                  onPress={() => setSort(val)}
                  style={{
                    flex: 1, borderRadius: 16, paddingVertical: 10,
                    alignItems: "center",
                    backgroundColor: sort === val ? colors.accent : colors.bgSurface,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: sort === val ? "#fff" : colors.textMuted }}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Button variant="primary" className="w-full rounded-2xl" onPress={() => setFilterOpen(false)}>
            <Button.Label>Appliquer</Button.Label>
          </Button>
        </View>
      </BottomModal>
    </SafeAreaView>
  );
}
