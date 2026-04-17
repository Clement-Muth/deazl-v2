import { Stack } from "expo-router";
import { BatchCookingRecipePreviewScreen } from "../../applications/recipe/ui/screens/batchCookingRecipePreviewScreen";

export default function BatchCookingRecipePreviewRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: "slide_from_right" }} />
      <BatchCookingRecipePreviewScreen />
    </>
  );
}
