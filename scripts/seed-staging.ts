import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qccvwajldbzykeekypzc.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MAIN_USER_EMAIL = "clementmuth@gmail.com";
const TEST_USER_EMAIL = "test@deazl.app";
const TEST_USER_PASSWORD = "test1234!";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const RECIPES = [
  {
    name: "Pâtes carbonara",
    description: "La vraie recette romaine, sans crème fraîche.",
    servings: 2,
    prep_time_minutes: 10,
    cook_time_minutes: 15,
    ingredients: [
      { custom_name: "Spaghetti", quantity: 200, unit: "g" },
      { custom_name: "Guanciale", quantity: 100, unit: "g" },
      { custom_name: "Jaunes d'œuf", quantity: 3, unit: "pièce" },
      { custom_name: "Pecorino Romano râpé", quantity: 50, unit: "g" },
      { custom_name: "Poivre noir", quantity: 1, unit: "pincée" },
    ],
    steps: [
      "Faire cuire les pâtes dans de l'eau bouillante salée jusqu'à al dente.",
      "Faire revenir le guanciale à feu moyen jusqu'à ce qu'il soit croustillant.",
      "Mélanger les jaunes d'œuf avec le pecorino et du poivre.",
      "Hors du feu, mélanger les pâtes avec le guanciale, puis ajouter le mélange œuf-fromage.",
    ],
  },
  {
    name: "Poulet rôti au citron",
    description: "Un classique du dimanche, parfumé au citron et aux herbes.",
    servings: 4,
    prep_time_minutes: 15,
    cook_time_minutes: 60,
    ingredients: [
      { custom_name: "Poulet entier", quantity: 1.5, unit: "kg" },
      { custom_name: "Citron", quantity: 2, unit: "pièce" },
      { custom_name: "Ail", quantity: 4, unit: "gousse" },
      { custom_name: "Thym", quantity: 3, unit: "branche" },
      { custom_name: "Huile d'olive", quantity: 3, unit: "c. à soupe" },
    ],
    steps: [
      "Préchauffer le four à 200 °C.",
      "Frotter le poulet avec l'huile, sel et poivre. Farcir avec citron, ail et thym.",
      "Enfourner 1h en arrosant toutes les 20 minutes.",
      "Laisser reposer 10 minutes avant de découper.",
    ],
  },
  {
    name: "Buddha bowl au quinoa",
    description: "Coloré, équilibré, bourré de nutriments.",
    servings: 2,
    prep_time_minutes: 15,
    cook_time_minutes: 15,
    dietary_tags: ["vegan", "gluten_free"],
    ingredients: [
      { custom_name: "Quinoa", quantity: 160, unit: "g" },
      { custom_name: "Pois chiches", quantity: 200, unit: "g" },
      { custom_name: "Avocat", quantity: 1, unit: "pièce" },
      { custom_name: "Carottes râpées", quantity: 100, unit: "g" },
      { custom_name: "Sauce tahini-citron", quantity: 3, unit: "c. à soupe" },
    ],
    steps: [
      "Cuire le quinoa selon les instructions du paquet.",
      "Rôtir les pois chiches au four 20 min à 200 °C.",
      "Assembler dans un bol et napper de sauce tahini.",
    ],
  },
  {
    name: "Omelette aux champignons",
    description: "Rapide, nourrissante et délicieuse.",
    servings: 2,
    prep_time_minutes: 5,
    cook_time_minutes: 10,
    dietary_tags: ["vegetarian"],
    ingredients: [
      { custom_name: "Œufs", quantity: 4, unit: "pièce" },
      { custom_name: "Champignons de Paris", quantity: 200, unit: "g" },
      { custom_name: "Beurre", quantity: 20, unit: "g" },
      { custom_name: "Persil frais", quantity: 2, unit: "c. à soupe" },
    ],
    steps: [
      "Faire sauter les champignons dans le beurre 5 min.",
      "Battre les œufs avec sel et poivre.",
      "Verser les œufs sur les champignons et cuire en repliant les bords.",
    ],
  },
];

const STORES = [
  { name: "Carrefour Nation", brand: "Carrefour", city: "Paris" },
  { name: "Monoprix Bastille", brand: "Monoprix", city: "Paris" },
];

async function seedRecipes(userId: string) {
  const created: string[] = [];
  for (const recipe of RECIPES) {
    const { ingredients, steps, dietary_tags, ...data } = recipe as typeof recipe & { dietary_tags?: string[] };
    const { data: r } = await admin
      .from("recipes")
      .insert({ ...data, user_id: userId, dietary_tags: dietary_tags ?? [] })
      .select("id")
      .single();
    if (!r) continue;
    created.push(r.id);
    await admin.from("recipe_ingredients").insert(
      ingredients.map((ing, i) => ({ ...ing, recipe_id: r.id, sort_order: i }))
    );
    await admin.from("recipe_steps").insert(
      steps.map((description, i) => ({ recipe_id: r.id, step_number: i + 1, description }))
    );
  }
  return created;
}

async function seedStores(userId: string) {
  for (const store of STORES) {
    const { data: existing } = await admin
      .from("stores")
      .select("id")
      .eq("name", store.name)
      .maybeSingle();

    let storeId = existing?.id;
    if (!storeId) {
      const { data: created } = await admin
        .from("stores")
        .insert(store)
        .select("id")
        .single();
      storeId = created?.id;
    }
    if (storeId) {
      await admin
        .from("user_stores")
        .upsert({ user_id: userId, store_id: storeId }, { onConflict: "user_id,store_id" });
    }
  }
}

async function createHouseholdForUsers(userId1: string, userId2: string) {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: household } = await admin
    .from("households")
    .insert({ created_by: userId1, invite_code: inviteCode })
    .select("id")
    .single();

  if (!household) return;

  await admin.from("household_members").insert([
    { household_id: household.id, user_id: userId1 },
    { household_id: household.id, user_id: userId2 },
  ]);

  return household.id;
}

async function seedShoppingList(userId: string, householdId: string) {
  const { data: list } = await admin
    .from("shopping_lists")
    .insert({ user_id: userId, status: "active", household_id: householdId })
    .select("id")
    .single();

  if (!list) return;

  await admin.from("shopping_items").insert([
    { shopping_list_id: list.id, custom_name: "Spaghetti", quantity: 500, unit: "g", sort_order: 0 },
    { shopping_list_id: list.id, custom_name: "Tomates cerises", quantity: 250, unit: "g", sort_order: 1 },
    { shopping_list_id: list.id, custom_name: "Mozzarella", quantity: 2, unit: "boule", sort_order: 2 },
    { shopping_list_id: list.id, custom_name: "Œufs", quantity: 6, unit: "pièce", sort_order: 3 },
    { shopping_list_id: list.id, custom_name: "Lait", quantity: 1, unit: "L", sort_order: 4 },
  ]);
}

async function main() {
  console.log("🌱 Seeding staging environment...\n");

  // 1. Get or create main user
  const { data: { users: allUsers } } = await admin.auth.admin.listUsers();
  const mainUser = allUsers.find((u) => u.email === MAIN_USER_EMAIL);
  if (!mainUser) {
    console.error(`❌ Main user ${MAIN_USER_EMAIL} not found. Please sign up first.`);
    process.exit(1);
  }
  console.log(`✅ Main user: ${MAIN_USER_EMAIL} (${mainUser.id})`);

  // 2. Create or get test user
  let testUser = allUsers.find((u) => u.email === TEST_USER_EMAIL);
  if (!testUser) {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Test User" },
    });
    if (error || !data.user) { console.error("❌ Failed to create test user:", error); process.exit(1); }
    testUser = data.user;
    console.log(`✅ Test user created: ${TEST_USER_EMAIL}`);
  } else {
    console.log(`✅ Test user already exists: ${TEST_USER_EMAIL}`);
  }

  // 3. Check if household already exists
  const { data: existingMembership } = await admin
    .from("household_members")
    .select("household_id")
    .eq("user_id", mainUser.id)
    .maybeSingle();

  let householdId = existingMembership?.household_id;
  if (!householdId) {
    householdId = await createHouseholdForUsers(mainUser.id, testUser.id);
    console.log(`✅ Household created (${householdId})`);
  } else {
    console.log(`✅ Household already exists (${householdId})`);
    // Add test user to household if not already member
    await admin
      .from("household_members")
      .upsert({ household_id: householdId, user_id: testUser.id }, { onConflict: "household_id,user_id" });
  }

  // 4. Seed recipes for both users
  const { data: mainRecipes } = await admin.from("recipes").select("id").eq("user_id", mainUser.id);
  if (!mainRecipes?.length) {
    await seedRecipes(mainUser.id);
    console.log(`✅ Recipes seeded for main user`);
  } else {
    console.log(`✅ Main user already has ${mainRecipes.length} recipes`);
  }

  const { data: testRecipes } = await admin.from("recipes").select("id").eq("user_id", testUser.id);
  if (!testRecipes?.length) {
    await seedRecipes(testUser.id);
    console.log(`✅ Recipes seeded for test user`);
  } else {
    console.log(`✅ Test user already has ${testRecipes.length} recipes`);
  }

  // 5. Seed stores for both users
  await seedStores(mainUser.id);
  await seedStores(testUser.id);
  console.log(`✅ Stores seeded for both users`);

  // 6. Seed shared shopping list
  const { data: existingList } = await admin
    .from("shopping_lists")
    .select("id")
    .eq("household_id", householdId)
    .eq("status", "active")
    .maybeSingle();

  if (!existingList) {
    await seedShoppingList(mainUser.id, householdId!);
    console.log(`✅ Shared shopping list created`);
  } else {
    console.log(`✅ Shopping list already exists`);
  }

  console.log("\n🎉 Done!\n");
  console.log(`📧 Test account: ${TEST_USER_EMAIL}`);
  console.log(`🔑 Password: ${TEST_USER_PASSWORD}`);
}

main().catch(console.error);
