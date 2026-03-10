import { useRouter } from "expo-router";
import { RecipeFormScreen } from "../../applications/recipe/ui/screens/recipeFormScreen";

export default function NewRecipePage() {
  const router = useRouter();

  function handleSuccess(id: string) {
    router.replace({ pathname: "/recipe/[id]", params: { id } });
  }

  return (
    <RecipeFormScreen
      onSuccess={handleSuccess}
      onBack={() => router.back()}
    />
  );
}
