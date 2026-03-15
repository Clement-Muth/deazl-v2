import { useCallback, useState } from "react";
import type { Recipe } from "../domain/entities/recipe";
import { getRecipes } from "../application/useCases/getRecipes";

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    getRecipes()
      .then((data) => { setRecipes(data); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { recipes, loading, error, refetch };
}
