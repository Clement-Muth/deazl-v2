import { Stack } from "expo-router";

export default function BadgeUnlockLayout() {
  return (
    <>
      <Stack.Screen options={{ presentation: "fullScreenModal", headerShown: false, animation: "slide_from_bottom" }} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
