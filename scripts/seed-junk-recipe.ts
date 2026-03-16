import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qccvwajldbzykeekypzc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjY3Z3YWpsZGJ6eWtlZWt5cHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk5MDQyNCwiZXhwIjoyMDg4NTY2NDI0fQ.MBwwrqtvSLIiDof-pFN9Ah-8W_g6hXmw1pCnUtBrpLM",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: profile } = await supabase.from("profiles").select("id").limit(1).single();
const userId = profile!.id;

const products = [
  {
    name: "Pain de mie industriel",
    brand: "Harry's",
    unit: "g",
    nova_group: 4,
    energy_kcal_100g: 265, proteins_100g: 8, carbohydrates_100g: 48, sugars_100g: 6,
    fat_100g: 4.5, saturated_fat_100g: 0.8, fiber_100g: 2.5, salt_100g: 1.1,
    serving_quantity: 30,
    allergens_tags: ["en:gluten", "en:milk", "en:soybeans", "en:sesame-seeds"],
    additives_tags: ["en:e282", "en:e471", "en:e481", "en:e920"],
  },
  {
    name: "Jambon industriel tranché",
    brand: "Herta",
    unit: "g",
    nova_group: 4,
    energy_kcal_100g: 107, proteins_100g: 15, carbohydrates_100g: 2, sugars_100g: 1.5,
    fat_100g: 4.5, saturated_fat_100g: 1.5, fiber_100g: 0, salt_100g: 2.2,
    serving_quantity: 45,
    allergens_tags: ["en:milk"],
    additives_tags: ["en:e250", "en:e301", "en:e316", "en:e407", "en:e450"],
  },
  {
    name: "Fromage fondu en tranches",
    brand: "Vache qui rit",
    unit: "g",
    nova_group: 4,
    energy_kcal_100g: 257, proteins_100g: 13, carbohydrates_100g: 8, sugars_100g: 4,
    fat_100g: 19, saturated_fat_100g: 13, fiber_100g: 0, salt_100g: 2.5,
    serving_quantity: 20,
    allergens_tags: ["en:milk", "en:eggs"],
    additives_tags: ["en:e339", "en:e452", "en:e407", "en:e160a"],
  },
  {
    name: "Mayonnaise industrielle",
    brand: "Amora",
    unit: "g",
    nova_group: 4,
    energy_kcal_100g: 680, proteins_100g: 1.5, carbohydrates_100g: 4, sugars_100g: 3,
    fat_100g: 72, saturated_fat_100g: 6, fiber_100g: 0, salt_100g: 1.8,
    serving_quantity: null,
    allergens_tags: ["en:eggs", "en:mustard", "en:soybeans"],
    additives_tags: ["en:e415", "en:e160a", "en:e385"],
  },
  {
    name: "Chips paprika",
    brand: "Lay's",
    unit: "g",
    nova_group: 4,
    energy_kcal_100g: 536, proteins_100g: 6, carbohydrates_100g: 52, sugars_100g: 2.5,
    fat_100g: 33, saturated_fat_100g: 3, fiber_100g: 4, salt_100g: 1.6,
    serving_quantity: null,
    allergens_tags: ["en:milk", "en:soybeans", "en:nuts"],
    additives_tags: ["en:e621", "en:e631", "en:e627", "en:e160c", "en:e330"],
  },
  {
    name: "Soda cola",
    brand: "Coca-Cola",
    unit: "ml",
    nova_group: 4,
    energy_kcal_100g: 42, proteins_100g: 0, carbohydrates_100g: 10.6, sugars_100g: 10.6,
    fat_100g: 0, saturated_fat_100g: 0, fiber_100g: 0, salt_100g: 0.01,
    serving_quantity: null,
    allergens_tags: [],
    additives_tags: ["en:e150d", "en:e338", "en:e330", "en:e952", "en:e951"],
  },
];

const { data: insertedProducts, error: prodError } = await supabase
  .from("products").insert(products).select("id, name");

if (prodError) { console.error(prodError); process.exit(1); }
const pMap = new Map(insertedProducts!.map(p => [p.name, p.id]));
console.log("Produits:", insertedProducts?.map(p => p.name));

const { data: recipe } = await supabase
  .from("recipes")
  .insert({
    user_id: userId,
    name: "Croque Monsieur Industriel",
    description: "La version ultra-transformée du grand classique.",
    servings: 2,
    prep_time_minutes: 5,
    cook_time_minutes: 5,
    is_public: false,
    dietary_tags: [],
  })
  .select("id").single();

const recipeId = recipe!.id;

await supabase.from("recipe_ingredients").insert([
  { recipe_id: recipeId, product_id: pMap.get("Pain de mie industriel"),    custom_name: "Pain de mie",       quantity: 4,  unit: "pièce",       is_optional: false, sort_order: 1 },
  { recipe_id: recipeId, product_id: pMap.get("Jambon industriel tranché"), custom_name: "Jambon",            quantity: 4,  unit: "pièce",       is_optional: false, sort_order: 2 },
  { recipe_id: recipeId, product_id: pMap.get("Fromage fondu en tranches"), custom_name: "Fromage fondu",     quantity: 4,  unit: "pièce",       is_optional: false, sort_order: 3 },
  { recipe_id: recipeId, product_id: pMap.get("Mayonnaise industrielle"),   custom_name: "Mayonnaise",        quantity: 2,  unit: "c. à soupe",  is_optional: false, sort_order: 4 },
  { recipe_id: recipeId, product_id: pMap.get("Chips paprika"),             custom_name: "Chips",             quantity: 50, unit: "g",           is_optional: false, sort_order: 5 },
  { recipe_id: recipeId, product_id: pMap.get("Soda cola"),                 custom_name: "Soda",              quantity: 33, unit: "cl",          is_optional: false, sort_order: 6 },
]);

await supabase.from("recipe_steps").insert([
  { recipe_id: recipeId, step_number: 1, description: "Tartiner les tranches de pain avec la mayonnaise." },
  { recipe_id: recipeId, step_number: 2, description: "Déposer le jambon et le fromage fondu entre deux tranches." },
  { recipe_id: recipeId, step_number: 3, description: "Passer au grille-pain 3 minutes. Servir avec les chips et le soda." },
]);

console.log("✅ Croque Monsieur Industriel créé :", recipeId);
