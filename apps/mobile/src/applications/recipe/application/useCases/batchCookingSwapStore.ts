import type { Recipe } from "../../domain/entities/recipe";

interface PendingPreview {
  recipe: Recipe;
  swapIndex: number;
}

interface PendingSwap {
  recipe: Recipe;
  swapIndex: number;
}

export interface EditSuggestion {
  recipe: Recipe;
  portions: number;
}

let _pendingPreview: PendingPreview | null = null;
let _pendingSwap: PendingSwap | null = null;

export function setPendingPreview(recipe: Recipe, swapIndex: number) {
  _pendingPreview = { recipe, swapIndex };
}

export function consumePendingPreview(): PendingPreview | null {
  const val = _pendingPreview;
  _pendingPreview = null;
  return val;
}

export function setPendingSwap(recipe: Recipe, swapIndex: number) {
  _pendingSwap = { recipe, swapIndex };
}

export function consumePendingSwap(): PendingSwap | null {
  const val = _pendingSwap;
  _pendingSwap = null;
  return val;
}

let _pendingEditSuggestions: EditSuggestion[] | null = null;

export function setPendingEditSuggestions(suggestions: EditSuggestion[]) {
  _pendingEditSuggestions = suggestions;
}

export function consumePendingEditSuggestions(): EditSuggestion[] | null {
  const val = _pendingEditSuggestions;
  _pendingEditSuggestions = null;
  return val;
}
