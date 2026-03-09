import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#E8571C",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Planning" }} />
      <Tabs.Screen name="recipes" options={{ title: "Recettes" }} />
      <Tabs.Screen name="shopping" options={{ title: "Courses" }} />
      <Tabs.Screen name="pantry" options={{ title: "Stock" }} />
    </Tabs>
  );
}
