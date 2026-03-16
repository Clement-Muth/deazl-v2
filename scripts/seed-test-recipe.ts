import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qccvwajldbzykeekypzc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjY3Z3YWpsZGJ6eWtlZWt5cHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk5MDQyNCwiZXhwIjoyMDg4NTY2NDI0fQ.MBwwrqtvSLIiDof-pFN9Ah-8W_g6hXmw1pCnUtBrpLM",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: profiles } = await supabase.from("profiles").select("id").limit(1).single();
if (!profiles) { console.error("Aucun utilisateur trouvé"); process.exit(1); }
const userId = profiles.id;
console.log("User:", userId);

const products = [
  { name: "Spaghetti n°5", brand: "Barilla", unit: "g", energy_kcal_100g: 353, proteins_100g: 13, carbohydrates_100g: 69, sugars_100g: 3.5, fat_100g: 1.5, saturated_fat_100g: 0.3, fiber_100g: 3, salt_100g: 0.01, serving_quantity: null },
  { name: "Steak haché 15% MG", brand: null, unit: "g", energy_kcal_100g: 231, proteins_100g: 18, carbohydrates_100g: 0, sugars_100g: 0, fat_100g: 18, saturated_fat_100g: 7.5, fiber_100g: 0, salt_100g: 0.18, serving_quantity: null },
  { name: "Tomates concassées", brand: "Mutti", unit: "g", energy_kcal_100g: 24, proteins_100g: 1.2, carbohydrates_100g: 4.2, sugars_100g: 3.8, fat_100g: 0.2, saturated_fat_100g: 0.03, fiber_100g: 1.1, salt_100g: 0.3, serving_quantity: null },
  { name: "Oignon jaune", brand: null, unit: "g", energy_kcal_100g: 40, proteins_100g: 1.1, carbohydrates_100g: 8.4, sugars_100g: 5.3, fat_100g: 0.1, saturated_fat_100g: 0.01, fiber_100g: 1.7, salt_100g: 0.01, serving_quantity: 80 },
  { name: "Ail", brand: null, unit: "g", energy_kcal_100g: 149, proteins_100g: 6.4, carbohydrates_100g: 30, sugars_100g: 1, fat_100g: 0.5, saturated_fat_100g: 0.09, fiber_100g: 2.1, salt_100g: 0.02, serving_quantity: 5 },
  { name: "Huile d'olive vierge extra", brand: "Puget", unit: "g", energy_kcal_100g: 884, proteins_100g: 0, carbohydrates_100g: 0, sugars_100g: 0, fat_100g: 100, saturated_fat_100g: 14, fiber_100g: 0, salt_100g: 0, serving_quantity: null },
];

const { data: insertedProducts, error: prodError } = await supabase
  .from("products")
  .insert(products)
  .select("id, name");

if (prodError) { console.error("Erreur produits:", prodError); process.exit(1); }
console.log("Produits insérés:", insertedProducts?.map(p => p.name));

const pMap = new Map(insertedProducts!.map(p => [p.name, p.id]));

const { data: recipe, error: recipeError } = await supabase
  .from("recipes")
  .insert({
    user_id: userId,
    name: "Spaghetti Bolognaise",
    description: "Un grand classique de la cuisine italienne, mijotée lentement pour un maximum de saveurs.",
    servings: 4,
    prep_time_minutes: 15,
    cook_time_minutes: 45,
    is_public: false,
    dietary_tags: [],
  })
  .select("id")
  .single();

if (recipeError) { console.error("Erreur recette:", recipeError); process.exit(1); }
const recipeId = recipe.id;
console.log("Recette créée:", recipeId);

const ingredients = [
  { recipe_id: recipeId, product_id: pMap.get("Spaghetti n°5"), custom_name: "Spaghetti", quantity: 400, unit: "g", is_optional: false, sort_order: 1, section: null },
  { recipe_id: recipeId, product_id: pMap.get("Steak haché 15% MG"), custom_name: "Steak haché", quantity: 500, unit: "g", is_optional: false, sort_order: 2, section: null },
  { recipe_id: recipeId, product_id: pMap.get("Tomates concassées"), custom_name: "Tomates concassées", quantity: 400, unit: "g", is_optional: false, sort_order: 3, section: null },
  { recipe_id: recipeId, product_id: pMap.get("Oignon jaune"), custom_name: "Oignon", quantity: 1, unit: "pièce", is_optional: false, sort_order: 4, section: null },
  { recipe_id: recipeId, product_id: pMap.get("Ail"), custom_name: "Ail", quantity: 2, unit: "gousse", is_optional: false, sort_order: 5, section: null },
  { recipe_id: recipeId, product_id: pMap.get("Huile d'olive vierge extra"), custom_name: "Huile d'olive", quantity: 2, unit: "c. à soupe", is_optional: false, sort_order: 6, section: null },
];

const { error: ingError } = await supabase.from("recipe_ingredients").insert(ingredients);
if (ingError) { console.error("Erreur ingrédients:", ingError); process.exit(1); }

const steps = [
  { recipe_id: recipeId, step_number: 1, description: "Épluchez et émincez finement l'oignon. Écrasez les gousses d'ail.", section: null },
  { recipe_id: recipeId, step_number: 2, description: "Faites chauffer l'huile d'olive dans une grande sauteuse à feu moyen. Faites revenir l'oignon 5 minutes jusqu'à ce qu'il soit translucide, puis ajoutez l'ail et faites revenir 1 minute.", section: null },
  { recipe_id: recipeId, step_number: 3, description: "Ajoutez le steak haché et faites-le dorer en l'émiettant à la spatule. Salez et poivrez.", section: null },
  { recipe_id: recipeId, step_number: 4, description: "Versez les tomates concassées, mélangez bien. Baissez le feu et laissez mijoter à couvert 35 minutes en remuant de temps en temps.", section: null },
  { recipe_id: recipeId, step_number: 5, description: "10 minutes avant la fin, faites cuire les spaghetti al dente dans une grande casserole d'eau bouillante salée selon les indications du paquet.", section: null },
  { recipe_id: recipeId, step_number: 6, description: "Égouttez les pâtes et servez avec la sauce bolognaise. Parsemez de parmesan râpé selon votre goût.", section: null },
];

const { error: stepsError } = await supabase.from("recipe_steps").insert(steps);
if (stepsError) { console.error("Erreur étapes:", stepsError); process.exit(1); }

console.log("✅ Recette de test créée avec succès !");
console.log("   → Spaghetti Bolognaise (4 portions)");
console.log("   → 6 ingrédients tous liés avec données nutritionnelles");
console.log("   → 6 étapes de préparation");
