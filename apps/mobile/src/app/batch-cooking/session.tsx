import { Stack } from "expo-router";
import { BatchCookingSessionScreen } from "../../applications/recipe/ui/screens/batchCookingSessionScreen";

export default function BatchCookingSessionRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, animation: "slide_from_right" }} />
      <BatchCookingSessionScreen />
    </>
  );
}
