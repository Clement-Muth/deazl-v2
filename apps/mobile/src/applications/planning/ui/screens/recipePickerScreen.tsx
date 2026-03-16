import { useFocusEffect } from "@react-navigation/native";
import { SearchField } from "heroui-native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useAppTheme } from "../../../../shared/theme";
import { useRecipes } from "../../../recipe/api/useRecipes";
import { GridCard } from "../../../recipe/ui/components/gridCard";
import { ThumbCard } from "../../../recipe/ui/components/thumbCard";
import { setMealSlot } from "../../application/useCases/setMealSlot";
import type { MealType } from "../../domain/entities/planning";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  dinner: "Dîner",
};

const GRID_CARD_WIDTH = (Dimensions.get("window").width - 32 - 12) / 2;

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

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const favorites = useMemo(() => recipes.filter((r) => r.isFavorite), [recipes]);
  const others = useMemo(() => {
    const favIds = new Set(favorites.map((r) => r.id));
    return recipes.filter((r) => !favIds.has(r.id));
  }, [recipes, favorites]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = normalize(search);
    return recipes.filter((r) => normalize(r.name).includes(q) || normalize(r.description ?? "").includes(q));
  }, [recipes, search]);

  const dateLabel = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

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

        <SearchField value={search} onChange={setSearch}>
          <SearchField.Group className="rounded-2xl">
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Rechercher une recette…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
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
          {searchResults !== null ? (
            <View style={{ paddingHorizontal: 16 }}>
              {searchResults.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 48 }}>
                  <Text style={{ fontSize: 14, color: colors.textSubtle }}>Aucune recette trouvée</Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                  {searchResults.map((recipe) => (
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
    </SafeAreaView>
  );
}
