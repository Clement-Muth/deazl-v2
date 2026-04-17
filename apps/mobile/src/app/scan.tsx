import { Stack } from "expo-router";
import { ScanScreen } from "../applications/catalog/ui/screens/scanScreen";

export default function ScanRoute() {
  return (
    <>
      <Stack.Screen options={{ presentation: "fullScreenModal", headerShown: false, animation: "slide_from_bottom" }} />
      <ScanScreen />
    </>
  );
}
