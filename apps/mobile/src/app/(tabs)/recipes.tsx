import { Text } from "heroui-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecipesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4 py-6">
        <Text className="text-2xl font-bold text-foreground">Recettes</Text>
      </View>
    </SafeAreaView>
  );
}
