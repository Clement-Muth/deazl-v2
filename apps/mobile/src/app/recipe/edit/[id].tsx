import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAppTheme } from "../../../shared/theme";
import { getRecipeById } from "../../../applications/recipe/application/useCases/getRecipeById";
import type { Recipe } from "../../../applications/recipe/domain/entities/recipe";
import { RecipeFormScreen } from "../../../applications/recipe/ui/screens/recipeFormScreen";

export default function EditRecipePage() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) getRecipeById(id).then(setRecipe).finally(() => setLoading(false));
  }, [id]);

  if (loading || !recipe) return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
      <ActivityIndicator color="#E8571C" size="large" />
    </View>
  );

  function handleSuccess() {
    router.back();
  }

  return (
    <RecipeFormScreen
      existingRecipe={recipe}
      onSuccess={handleSuccess}
      onBack={() => router.back()}
    />
  );
}
