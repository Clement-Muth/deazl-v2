import type { CookingSession } from "../types/cookingSession";

let _promise: Promise<CookingSession> | null = null;

export function setPendingGeneration(p: Promise<CookingSession>) {
  _promise = p;
}

export function consumePendingGeneration(): Promise<CookingSession> | null {
  const p = _promise;
  _promise = null;
  return p;
}
