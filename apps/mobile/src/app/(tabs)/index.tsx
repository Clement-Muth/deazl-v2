import { Button, Card, Text } from "heroui-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PlanningScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-4 py-6 gap-4">
        <Text className="text-2xl font-bold text-foreground">Planning</Text>
        <Card className="p-4">
          <Text className="text-foreground font-semibold mb-2">Cette semaine</Text>
          <Text className="text-default-500 text-sm">
            Planifiez vos repas de la semaine et générez votre liste de courses automatiquement.
          </Text>
        </Card>
        <Button color="primary" onPress={() => {}}>
          Générer la liste de courses
        </Button>
      </View>
    </SafeAreaView>
  );
}
