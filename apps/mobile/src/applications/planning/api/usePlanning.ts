import { useCallback, useEffect, useRef, useState } from "react";
import type { MealPlanData } from "../domain/entities/planning";
import { getMealPlan } from "../application/useCases/getMealPlan";

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function usePlanning(weekStart?: Date) {
  const [plan, setPlan] = useState<MealPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const targetWeek = weekStart ?? getMondayOf(new Date());

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await getMealPlan(targetWeek);
      if (requestId !== requestIdRef.current) return;
      setPlan(data);
      setError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [targetWeek.toISOString()]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { plan, loading, error, reload };
}
