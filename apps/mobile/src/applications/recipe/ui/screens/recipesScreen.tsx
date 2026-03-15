import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Button, Chip, SearchField } from "heroui-native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { BottomModal, BottomModalScrollView } from "../../../shopping/ui/components/bottomModal";
import { useRecipes } from "../../api/useRecipes";
import type { Recipe } from "../../domain/entities/recipe";
import { GridCard } from "../components/gridCard";
import { HeroCard } from "../components/heroCard";
import { ListCard } from "../components/listCard";
import { DIETARY_LABELS } from "../components/recipeUtils";
import { ThumbCard } from "../components/thumbCard";

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

type SortOption = "recent" | "fast" | "slow";
type QuickFilter = "favorites" | null;

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: "700", color: "#78716C99", textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 10, paddingHorizontal: 16 }}>
      {label}
    </Text>
  );
}

export function RecipesScreen() {
  const router = useRouter();
  const { recipes, loading, refetch } = useRecipes();
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState("any");
  const [sort, setSort] = useState<SortOption>("recent");
  const [filterOpen, setFilterOpen] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

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
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#1C1917", letterSpacing: -0.5, marginBottom: 16 }}>Recettes</Text>

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
                {filtered.map((recipe) => (
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

      <BottomModal isOpen={filterOpen} onClose={() => setFilterOpen(false)} height="75%">
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Filtres</Text>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              {(activeTags.length > 0 || timeFilter !== "any" || sort !== "recent") && (
                <Pressable onPress={() => { setActiveTags([]); setTimeFilter("any"); setSort("recent"); }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#E8571C" }}>Tout effacer</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setFilterOpen(false)}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Line x1={18} y1={6} x2={6} y2={18} />
                  <Line x1={6} y1={6} x2={18} y2={18} />
                </Svg>
              </Pressable>
            </View>
          </View>

          <BottomModalScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
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
          </BottomModalScrollView>
        </View>
      </BottomModal>
    </SafeAreaView>
  );
}
