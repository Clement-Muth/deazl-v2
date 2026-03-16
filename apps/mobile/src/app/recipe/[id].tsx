import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { BackHandler } from "react-native";
import { RecipeDetailScreen } from "../../applications/recipe/ui/screens/recipeDetailScreen";

export default function RecipeDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  function goToRecipes() {
    router.navigate("/(tabs)/recipes" as never);
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      goToRecipes();
      return true;
    });
    return () => sub.remove();
  }, []);

  return (
    <RecipeDetailScreen
      id={id}
      onBack={goToRecipes}
      onEdit={(recipeId) => router.push({ pathname: "/recipe/edit/[id]", params: { id: recipeId } } as never)}
      onDelete={goToRecipes}
    />
  );
}
