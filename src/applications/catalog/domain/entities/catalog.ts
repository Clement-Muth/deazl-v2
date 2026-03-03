export interface CatalogProduct {
  id: string;
  offId: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  nutriscoreGrade: string | null;
  ecoscoreGrade: string | null;
  novaGroup: number | null;
  unit: string;
}

export interface OFFProduct {
  offId: string;
  name: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  nutriscoreGrade: string | null;
  ecoscoreGrade: string | null;
  novaGroup: number | null;
}

export interface OFFNutriments {
  energyKcal: number | null;
  fat: number | null;
  saturatedFat: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  fiber: number | null;
  proteins: number | null;
  salt: number | null;
}

export interface OFFProductFull {
  offId: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  nutriscoreGrade: string | null;
  ecoscoreGrade: string | null;
  novaGroup: number | null;
  ingredientsText: string | null;
  allergenTags: string[];
  additiveTags: string[];
  labelTags: string[];
  nutriments: OFFNutriments;
}
