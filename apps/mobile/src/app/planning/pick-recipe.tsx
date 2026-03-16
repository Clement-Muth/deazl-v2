import { useLocalSearchParams, useRouter } from "expo-router";
import { RecipePickerScreen } from "../../applications/planning/ui/screens/recipePickerScreen";
import type { MealType } from "../../applications/planning/domain/entities/planning";

export default function PickRecipePage() {
  const router = useRouter();
  const { dayOfWeek, mealType, mealPlanId, dateStr } = useLocalSearchParams<{
    dayOfWeek: string;
    mealType: string;
    mealPlanId: string;
    dateStr: string;
  }>();

  return (
    <RecipePickerScreen
      dayOfWeek={Number(dayOfWeek)}
      mealType={mealType as MealType}
      mealPlanId={mealPlanId}
      date={new Date(dateStr)}
      onBack={() => router.back()}
      onDone={() => router.back()}
    />
  );
}
