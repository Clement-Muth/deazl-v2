import { Stack } from "expo-router";
import { BatchCookingSetupScreen } from "../../applications/recipe/ui/screens/batchCookingSetupScreen";

export default function BatchCookingSetupRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <BatchCookingSetupScreen />
    </>
  );
}
