import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { RecipeDetailScreen } from "../../applications/recipe/ui/screens/recipeDetailScreen";

export default function BatchCookingRecipeViewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: "slide_from_right" }} />
      <RecipeDetailScreen
        id={id}
        onBack={() => router.back()}
        onEdit={(recipeId) => router.push({ pathname: "/recipe/edit/[id]", params: { id: recipeId } } as never)}
        onDelete={() => router.back()}
      />
    </>
  );
}
