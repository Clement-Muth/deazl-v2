import { useCallback, useState } from "react";
import type { Recipe } from "../domain/entities/recipe";
import { getCuratedRecipes } from "../application/useCases/getCuratedRecipes";

export function useCuratedRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    getCuratedRecipes()
      .then((data) => { setRecipes(data); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { recipes, setRecipes, loading, error, refetch };
}
