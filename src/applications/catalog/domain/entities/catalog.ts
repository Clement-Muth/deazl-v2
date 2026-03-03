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
