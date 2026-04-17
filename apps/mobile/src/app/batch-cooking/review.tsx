import { Stack, useLocalSearchParams } from "expo-router";
import { BatchCookingReviewScreen } from "../../applications/recipe/ui/screens/batchCookingReviewScreen";

export default function BatchCookingReviewRoute() {
  const { mealCount, persons, recipeCount } = useLocalSearchParams<{
    mealCount: string;
    persons: string;
    recipeCount: string;
  }>();

  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: "slide_from_right" }} />
      <BatchCookingReviewScreen
        mealCount={Number(mealCount ?? "4")}
        persons={Number(persons ?? "2")}
        recipeCount={(Number(recipeCount ?? "2") as 1 | 2 | 3)}
      />
    </>
  );
}
