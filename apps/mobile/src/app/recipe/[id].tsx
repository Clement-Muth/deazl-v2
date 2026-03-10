import { useLocalSearchParams, useRouter } from "expo-router";
import { RecipeDetailScreen } from "../../applications/recipe/ui/screens/recipeDetailScreen";

export default function RecipeDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <RecipeDetailScreen
      id={id}
      onBack={() => router.navigate("/(tabs)/recipes" as never)}
      onEdit={(recipeId) => router.push({ pathname: "/recipe/edit/[id]", params: { id: recipeId } } as never)}
      onDelete={() => router.navigate("/(tabs)/recipes" as never)}
    />
  );
}
