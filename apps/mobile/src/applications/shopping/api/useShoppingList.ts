import { useCallback, useEffect, useState } from "react";
import type { ShoppingList } from "../domain/entities/shopping";
import { getActiveShoppingList } from "../application/useCases/getActiveShoppingList";

export function useShoppingList() {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getActiveShoppingList();
      setList(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const silentReload = useCallback(async () => {
    try {
      const data = await getActiveShoppingList();
      setList(data);
    } catch {}
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { list, setList, loading, error, reload, silentReload };
}
