export const STORE_BRANDS = [
  "Carrefour", "Leclerc", "Lidl", "Aldi", "Intermarché",
  "Auchan", "Monoprix", "Casino", "Picard", "Franprix",
] as const;

export type StoreBrand = (typeof STORE_BRANDS)[number];
