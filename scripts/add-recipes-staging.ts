import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qccvwajldbzykeekypzc.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const RECIPES = [
  {
    name: "Ratatouille provençale",
    description: "Un plat du sud ensoleillé, mijoté longuement.",
    servings: 4, prep_time_minutes: 20, cook_time_minutes: 50,
    dietary_tags: ["vegan", "gluten_free"],
    image_url: "https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=800&q=80",
    ingredients: [
      { custom_name: "Aubergine", quantity: 2, unit: "pièce" },
      { custom_name: "Courgette", quantity: 2, unit: "pièce" },
      { custom_name: "Poivron rouge", quantity: 1, unit: "pièce" },
      { custom_name: "Tomates", quantity: 4, unit: "pièce" },
      { custom_name: "Oignon", quantity: 1, unit: "pièce" },
      { custom_name: "Ail", quantity: 3, unit: "gousse" },
      { custom_name: "Herbes de Provence", quantity: 1, unit: "c. à soupe" },
    ],
    steps: ["Couper tous les légumes en dés.", "Faire revenir l'oignon et l'ail dans l'huile d'olive.", "Ajouter les légumes et laisser mijoter 40 min à feu doux.", "Assaisonner et servir chaud ou froid."],
  },
  {
    name: "Tarte aux pommes",
    description: "La tarte classique de grand-mère.",
    servings: 6, prep_time_minutes: 25, cook_time_minutes: 35,
    dietary_tags: ["vegetarian"],
    image_url: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=800&q=80",
    ingredients: [
      { custom_name: "Pâte brisée", quantity: 1, unit: "rouleau" },
      { custom_name: "Pommes Golden", quantity: 4, unit: "pièce" },
      { custom_name: "Sucre", quantity: 50, unit: "g" },
      { custom_name: "Beurre", quantity: 30, unit: "g" },
      { custom_name: "Cannelle", quantity: 0.5, unit: "c. à café" },
    ],
    steps: ["Préchauffer le four à 180°C.", "Étaler la pâte dans un moule.", "Disposer les pommes en lamelles, saupoudrer de sucre et cannelle.", "Enfourner 35 min jusqu'à dorure."],
  },
  {
    name: "Curry de lentilles",
    description: "Un dal réconfortant et épicé.",
    servings: 4, prep_time_minutes: 10, cook_time_minutes: 30,
    dietary_tags: ["vegan", "gluten_free"],
    image_url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
    ingredients: [
      { custom_name: "Lentilles corail", quantity: 250, unit: "g" },
      { custom_name: "Lait de coco", quantity: 400, unit: "ml" },
      { custom_name: "Tomates concassées", quantity: 400, unit: "g" },
      { custom_name: "Oignon", quantity: 1, unit: "pièce" },
      { custom_name: "Curry en poudre", quantity: 2, unit: "c. à soupe" },
      { custom_name: "Gingembre frais", quantity: 1, unit: "c. à café" },
    ],
    steps: ["Faire revenir l'oignon avec le curry et le gingembre.", "Ajouter les lentilles, tomates et lait de coco.", "Laisser mijoter 25 min en remuant régulièrement.", "Servir avec du riz basmati."],
  },
  {
    name: "Tacos au bœuf",
    description: "Des tacos maison savoureux et festifs.",
    servings: 4, prep_time_minutes: 15, cook_time_minutes: 15,
    dietary_tags: [],
    image_url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
    ingredients: [
      { custom_name: "Bœuf haché", quantity: 400, unit: "g" },
      { custom_name: "Tortillas de maïs", quantity: 8, unit: "pièce" },
      { custom_name: "Avocat", quantity: 2, unit: "pièce" },
      { custom_name: "Cheddar râpé", quantity: 100, unit: "g" },
      { custom_name: "Crème fraîche", quantity: 4, unit: "c. à soupe" },
      { custom_name: "Épices tex-mex", quantity: 2, unit: "c. à café" },
    ],
    steps: ["Faire revenir le bœuf avec les épices tex-mex.", "Préparer le guacamole avec les avocats.", "Réchauffer les tortillas.", "Garnir avec le bœuf, guacamole, cheddar et crème."],
  },
  {
    name: "Risotto aux champignons",
    description: "Crémeux à souhait, un risotto parfait.",
    servings: 4, prep_time_minutes: 10, cook_time_minutes: 30,
    dietary_tags: ["vegetarian"],
    image_url: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80",
    ingredients: [
      { custom_name: "Riz arborio", quantity: 320, unit: "g" },
      { custom_name: "Champignons mixtes", quantity: 300, unit: "g" },
      { custom_name: "Bouillon de légumes", quantity: 1.2, unit: "L" },
      { custom_name: "Parmesan râpé", quantity: 80, unit: "g" },
      { custom_name: "Vin blanc", quantity: 100, unit: "ml" },
      { custom_name: "Échalote", quantity: 2, unit: "pièce" },
    ],
    steps: ["Faire revenir les échalotes et champignons.", "Ajouter le riz et nacrer 2 min.", "Déglacer au vin blanc puis ajouter le bouillon louche par louche.", "Hors du feu, mantecare avec le parmesan et le beurre."],
  },
  {
    name: "Pancakes moelleux",
    description: "Des pancakes épais et dorés pour le brunch.",
    servings: 2, prep_time_minutes: 10, cook_time_minutes: 15,
    dietary_tags: ["vegetarian"],
    image_url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
    ingredients: [
      { custom_name: "Farine", quantity: 150, unit: "g" },
      { custom_name: "Lait", quantity: 200, unit: "ml" },
      { custom_name: "Oeuf", quantity: 1, unit: "pièce" },
      { custom_name: "Levure chimique", quantity: 1, unit: "c. à café" },
      { custom_name: "Sucre", quantity: 20, unit: "g" },
      { custom_name: "Beurre", quantity: 30, unit: "g" },
    ],
    steps: ["Mélanger farine, sucre et levure.", "Ajouter le lait, l'oeuf et le beurre fondu.", "Cuire des louches de pâte dans une poêle beurrée 2 min par côté.", "Servir avec sirop d'érable ou fruits rouges."],
  },
  {
    name: "Saumon teriyaki",
    description: "Un pavé de saumon laqué, prêt en 20 minutes.",
    servings: 2, prep_time_minutes: 5, cook_time_minutes: 15,
    dietary_tags: ["gluten_free"],
    image_url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80",
    ingredients: [
      { custom_name: "Pavés de saumon", quantity: 2, unit: "pièce" },
      { custom_name: "Sauce soja", quantity: 3, unit: "c. à soupe" },
      { custom_name: "Miel", quantity: 2, unit: "c. à soupe" },
      { custom_name: "Huile de sésame", quantity: 1, unit: "c. à soupe" },
      { custom_name: "Gingembre", quantity: 1, unit: "c. à café" },
    ],
    steps: ["Mélanger soja, miel, sésame et gingembre pour la marinade.", "Faire mariner le saumon 10 min.", "Cuire à la poêle 4 min par côté en laquant avec la marinade.", "Servir avec riz et sésame grillé."],
  },
  {
    name: "Crème brûlée",
    description: "Le dessert français emblématique, craquant à souhait.",
    servings: 4, prep_time_minutes: 15, cook_time_minutes: 45,
    dietary_tags: ["vegetarian"],
    image_url: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=800&q=80",
    ingredients: [
      { custom_name: "Crème liquide entière", quantity: 500, unit: "ml" },
      { custom_name: "Jaunes d'oeuf", quantity: 5, unit: "pièce" },
      { custom_name: "Sucre", quantity: 100, unit: "g" },
      { custom_name: "Vanille", quantity: 1, unit: "gousse" },
      { custom_name: "Cassonade", quantity: 4, unit: "c. à soupe" },
    ],
    steps: ["Infuser la vanille dans la crème chaude.", "Blanchir les jaunes avec le sucre.", "Mélanger et verser dans des ramequins. Cuire au bain-marie 40 min à 150°C.", "Réfrigérer puis caraméliser au chalumeau."],
  },
  {
    name: "Wrap au thon avocat",
    description: "Un wrap frais et rapide pour le déjeuner.",
    servings: 2, prep_time_minutes: 10, cook_time_minutes: 0,
    dietary_tags: [],
    image_url: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80",
    ingredients: [
      { custom_name: "Tortillas de blé", quantity: 2, unit: "pièce" },
      { custom_name: "Thon en boîte", quantity: 150, unit: "g" },
      { custom_name: "Avocat", quantity: 1, unit: "pièce" },
      { custom_name: "Tomate", quantity: 1, unit: "pièce" },
      { custom_name: "Salade iceberg", quantity: 2, unit: "feuille" },
      { custom_name: "Mayonnaise", quantity: 2, unit: "c. à soupe" },
    ],
    steps: ["Écraser l'avocat avec du citron et du sel.", "Mélanger le thon égoutté avec la mayo.", "Garnir les tortillas et rouler serré.", "Couper en deux et servir."],
  },
  {
    name: "Soupe de tomates rôties",
    description: "Veloutée et parfumée, une soupe d'hiver réconfortante.",
    servings: 4, prep_time_minutes: 10, cook_time_minutes: 40,
    dietary_tags: ["vegan", "gluten_free"],
    image_url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
    ingredients: [
      { custom_name: "Tomates roma", quantity: 1, unit: "kg" },
      { custom_name: "Ail", quantity: 4, unit: "gousse" },
      { custom_name: "Oignon rouge", quantity: 1, unit: "pièce" },
      { custom_name: "Bouillon de légumes", quantity: 500, unit: "ml" },
      { custom_name: "Basilic frais", quantity: 1, unit: "bouquet" },
      { custom_name: "Huile d'olive", quantity: 3, unit: "c. à soupe" },
    ],
    steps: ["Rôtir les tomates, l'ail et l'oignon au four 30 min à 200°C.", "Mixer avec le bouillon chaud.", "Passer au tamis pour une texture veloutée.", "Servir avec du basilic et un filet d'huile d'olive."],
  },
];

async function main() {
  const { data: { users } } = await admin.auth.admin.listUsers();
  const mainUser = users.find((u) => u.email === "clementmuth@gmail.com");
  const testUser = users.find((u) => u.email === "test@deazl.app");

  if (!mainUser || !testUser) {
    console.error("Users not found");
    process.exit(1);
  }

  for (const recipe of RECIPES) {
    const { ingredients, steps, dietary_tags, ...data } = recipe;
    for (const userId of [mainUser.id, testUser.id]) {
      const { data: r } = await admin
        .from("recipes")
        .insert({ ...data, user_id: userId, dietary_tags })
        .select("id")
        .single();
      if (!r) continue;
      await admin.from("recipe_ingredients").insert(
        ingredients.map((ing, i) => ({ ...ing, recipe_id: r.id, sort_order: i }))
      );
      await admin.from("recipe_steps").insert(
        steps.map((description, i) => ({ recipe_id: r.id, step_number: i + 1, description }))
      );
    }
    console.log(`✅ ${recipe.name}`);
  }

  console.log(`\n🎉 ${RECIPES.length} recettes ajoutées pour les 2 comptes !`);
}

main().catch(console.error);
