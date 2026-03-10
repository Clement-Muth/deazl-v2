import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sqjfvkmgdyardcbpcwan.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxamZ2a21nZHlhcmRjYnBjd2FuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ1MDI1MywiZXhwIjoyMDg4MDI2MjUzfQ.oSqD9FAtRpJ_rAeA7nshlPJ-nql9uwc0m3yAi9O76Pk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function getMondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function addWeeks(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n * 7);
  return r;
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function run() {
  // ── Get user ─────────────────────────────────────────────────────────────
  const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) throw usersErr;
  const user = users.find((u) => u.email === "clementmuth@gmail.com");
  if (!user) throw new Error("User clementmuth@gmail.com not found");
  const uid = user.id;
  console.log(`✓ User found: ${uid}`);

  // ── Update profile & user metadata ───────────────────────────────────────
  await supabase.auth.admin.updateUserById(uid, {
    user_metadata: {
      full_name: "Clément Muth",
      household_size: 2,
      dietary_preferences: ["no_pork"],
      onboarding_completed: true,
    },
  });
  await supabase.from("profiles").upsert({ id: uid, display_name: "Clément Muth" });
  console.log("✓ Profile updated");

  // ── Stores ────────────────────────────────────────────────────────────────
  const storeNames = ["Carrefour Paris Nation", "Monoprix Oberkampf", "Lidl Porte de Vincennes", "Franprix Bastille"];
  const { data: existingStores } = await supabase.from("stores").select("id, name").in("name", storeNames);
  const existingStoreNames = new Set((existingStores ?? []).map((s: { name: string }) => s.name));

  const storesToInsert = [
    { name: "Carrefour Paris Nation",    brand: "Carrefour", city: "Paris", address: "6 Pl. de la Nation, 75012 Paris",       latitude: 48.8484, longitude: 2.3961 },
    { name: "Monoprix Oberkampf",        brand: "Monoprix",  city: "Paris", address: "97 Rue Oberkampf, 75011 Paris",         latitude: 48.8638, longitude: 2.3717 },
    { name: "Lidl Porte de Vincennes",   brand: "Lidl",      city: "Paris", address: "210 Rue du Faubourg St-Antoine, 75012", latitude: 48.8506, longitude: 2.4006 },
    { name: "Franprix Bastille",         brand: "Franprix",  city: "Paris", address: "35 Rue de la Roquette, 75011 Paris",    latitude: 48.8541, longitude: 2.3723 },
  ].filter((s) => !existingStoreNames.has(s.name));

  if (storesToInsert.length > 0) {
    await supabase.from("stores").insert(storesToInsert);
  }

  const { data: allStores } = await supabase.from("stores").select("id, name").in("name", storeNames);
  const storeIds = Object.fromEntries((allStores ?? []).map((s: { name: string; id: string }) => [s.name, s.id]));
  const carrefourId  = storeIds["Carrefour Paris Nation"];
  const monoprixId   = storeIds["Monoprix Oberkampf"];
  const lidlId       = storeIds["Lidl Porte de Vincennes"];
  const franprixId   = storeIds["Franprix Bastille"];
  console.log("✓ Stores:", Object.keys(storeIds).join(", "));

  // Lier les magasins à l'utilisateur
  const { data: existingUserStores } = await supabase.from("user_stores").select("store_id").eq("user_id", uid);
  const linkedStoreIds = new Set((existingUserStores ?? []).map((us: { store_id: string }) => us.store_id));
  const userStoresToInsert = [carrefourId, monoprixId, lidlId, franprixId]
    .filter((id) => id && !linkedStoreIds.has(id))
    .map((store_id) => ({ user_id: uid, store_id }));
  if (userStoresToInsert.length > 0) {
    await supabase.from("user_stores").insert(userStoresToInsert);
  }
  console.log("✓ User stores linked");

  // ── Products ──────────────────────────────────────────────────────────────
  const { data: products, error: prodErr } = await supabase.from("products").upsert([
    { off_id: "3017620422003", name: "Nutella",                   brand: "Ferrero",    nutriscore_grade: "e", nova_group: 4, unit: "g",   category: "Pâtes à tartiner" },
    { off_id: "3560070976478", name: "Pâtes rigatoni",            brand: "Barilla",    nutriscore_grade: "b", nova_group: 2, unit: "g",   category: "Pâtes" },
    { off_id: "3270190022333", name: "Riz basmati",               brand: "Taureau Ailé", nutriscore_grade: "b", nova_group: 1, unit: "g", category: "Riz" },
    { off_id: "3073781132806", name: "Fromage râpé emmental",     brand: "Président",  nutriscore_grade: "c", nova_group: 2, unit: "g",   category: "Fromages" },
    { off_id: "3168930010265", name: "Beurre doux",               brand: "Président",  nutriscore_grade: "d", nova_group: 1, unit: "g",   category: "Beurre" },
    { off_id: "3175680011480", name: "Lait demi-écrémé",          brand: "Lactel",     nutriscore_grade: "b", nova_group: 1, unit: "ml",  category: "Laits" },
    { off_id: "3564700011177", name: "Œufs frais plein air (x6)", brand: "La Ferme",   nutriscore_grade: "a", nova_group: 1, unit: "pièce", category: "Œufs" },
    { off_id: "20724696",      name: "Poulet entier fermier",     brand: null,         nutriscore_grade: "b", nova_group: 1, unit: "g",   category: "Volaille" },
    { off_id: "3700789603094", name: "Saumon atlantique",         brand: "Labeyrie",   nutriscore_grade: "b", nova_group: 1, unit: "g",   category: "Poissons" },
    { off_id: "3560071027149", name: "Tomates cerises",           brand: null,         nutriscore_grade: "a", nova_group: 1, unit: "g",   category: "Fruits & Légumes" },
    { off_id: "3526110020423", name: "Lardons fumés",             brand: "Herta",      nutriscore_grade: "d", nova_group: 3, unit: "g",   category: "Charcuterie" },
    { off_id: "3256220018174", name: "Crème fraîche épaisse",     brand: "Isigny",     nutriscore_grade: "c", nova_group: 1, unit: "ml",  category: "Crèmes" },
    { off_id: "3154230007021", name: "Farine de blé T55",         brand: "Francine",   nutriscore_grade: "b", nova_group: 1, unit: "g",   category: "Farines" },
    { off_id: "3270190013317", name: "Lentilles vertes du Puy",   brand: "Sabarot",    nutriscore_grade: "a", nova_group: 1, unit: "g",   category: "Légumineuses" },
    { off_id: "3250390009869", name: "Tomates pelées au jus",     brand: "Mutti",      nutriscore_grade: "a", nova_group: 1, unit: "g",   category: "Conserves" },
  ], { onConflict: "off_id", ignoreDuplicates: false }).select("id, name");
  if (prodErr) throw prodErr;

  const pMap = Object.fromEntries(products!.map((p) => [p.name, p.id]));
  console.log("✓ Products:", products!.length);

  // ── Prices ────────────────────────────────────────────────────────────────
  const priceRows = [
    // Nutella
    { product_id: pMap["Nutella"],                   store_id: carrefourId, price: 3.49, quantity: 400,  unit: "g",     reported_by: uid },
    { product_id: pMap["Nutella"],                   store_id: monoprixId,  price: 3.89, quantity: 400,  unit: "g",     reported_by: uid },
    { product_id: pMap["Nutella"],                   store_id: lidlId,      price: 3.19, quantity: 400,  unit: "g",     reported_by: uid },
    // Pâtes
    { product_id: pMap["Pâtes rigatoni"],            store_id: carrefourId, price: 1.29, quantity: 500,  unit: "g",     reported_by: uid },
    { product_id: pMap["Pâtes rigatoni"],            store_id: lidlId,      price: 0.99, quantity: 500,  unit: "g",     reported_by: uid },
    { product_id: pMap["Pâtes rigatoni"],            store_id: monoprixId,  price: 1.59, quantity: 500,  unit: "g",     reported_by: uid },
    // Riz
    { product_id: pMap["Riz basmati"],               store_id: carrefourId, price: 2.19, quantity: 1000, unit: "g",     reported_by: uid },
    { product_id: pMap["Riz basmati"],               store_id: lidlId,      price: 1.79, quantity: 1000, unit: "g",     reported_by: uid },
    // Fromage
    { product_id: pMap["Fromage râpé emmental"],     store_id: carrefourId, price: 2.89, quantity: 200,  unit: "g",     reported_by: uid },
    { product_id: pMap["Fromage râpé emmental"],     store_id: monoprixId,  price: 3.29, quantity: 200,  unit: "g",     reported_by: uid },
    { product_id: pMap["Fromage râpé emmental"],     store_id: franprixId,  price: 3.49, quantity: 200,  unit: "g",     reported_by: uid },
    // Beurre
    { product_id: pMap["Beurre doux"],               store_id: carrefourId, price: 2.49, quantity: 250,  unit: "g",     reported_by: uid },
    { product_id: pMap["Beurre doux"],               store_id: lidlId,      price: 2.09, quantity: 250,  unit: "g",     reported_by: uid },
    // Lait
    { product_id: pMap["Lait demi-écrémé"],          store_id: carrefourId, price: 0.99, quantity: 1000, unit: "ml",    reported_by: uid },
    { product_id: pMap["Lait demi-écrémé"],          store_id: lidlId,      price: 0.85, quantity: 1000, unit: "ml",    reported_by: uid },
    { product_id: pMap["Lait demi-écrémé"],          store_id: monoprixId,  price: 1.15, quantity: 1000, unit: "ml",    reported_by: uid },
    // Œufs
    { product_id: pMap["Œufs frais plein air (x6)"], store_id: carrefourId, price: 2.89, quantity: 6,    unit: "pièce", reported_by: uid },
    { product_id: pMap["Œufs frais plein air (x6)"], store_id: monoprixId,  price: 3.29, quantity: 6,    unit: "pièce", reported_by: uid },
    { product_id: pMap["Œufs frais plein air (x6)"], store_id: lidlId,      price: 2.49, quantity: 6,    unit: "pièce", reported_by: uid },
    // Lardons
    { product_id: pMap["Lardons fumés"],              store_id: carrefourId, price: 1.89, quantity: 200,  unit: "g",     reported_by: uid },
    { product_id: pMap["Lardons fumés"],              store_id: franprixId,  price: 2.19, quantity: 200,  unit: "g",     reported_by: uid },
    // Crème
    { product_id: pMap["Crème fraîche épaisse"],      store_id: monoprixId,  price: 1.59, quantity: 200,  unit: "ml",    reported_by: uid },
    { product_id: pMap["Crème fraîche épaisse"],      store_id: carrefourId, price: 1.39, quantity: 200,  unit: "ml",    reported_by: uid },
    // Farine
    { product_id: pMap["Farine de blé T55"],          store_id: carrefourId, price: 0.79, quantity: 1000, unit: "g",     reported_by: uid },
    { product_id: pMap["Farine de blé T55"],          store_id: lidlId,      price: 0.65, quantity: 1000, unit: "g",     reported_by: uid },
    // Lentilles
    { product_id: pMap["Lentilles vertes du Puy"],    store_id: monoprixId,  price: 2.49, quantity: 500,  unit: "g",     reported_by: uid },
    { product_id: pMap["Lentilles vertes du Puy"],    store_id: carrefourId, price: 2.19, quantity: 500,  unit: "g",     reported_by: uid },
    // Tomates cerises
    { product_id: pMap["Tomates cerises"],            store_id: carrefourId, price: 2.99, quantity: 500,  unit: "g",     reported_by: uid },
    { product_id: pMap["Tomates cerises"],            store_id: monoprixId,  price: 3.49, quantity: 500,  unit: "g",     reported_by: uid },
    // Tomates pelées
    { product_id: pMap["Tomates pelées au jus"],      store_id: carrefourId, price: 0.89, quantity: 400,  unit: "g",     reported_by: uid },
    { product_id: pMap["Tomates pelées au jus"],      store_id: lidlId,      price: 0.69, quantity: 400,  unit: "g",     reported_by: uid },
  ];
  const { error: pricesErr } = await supabase.from("prices").insert(priceRows);
  if (pricesErr) console.warn("Prices (some may be duplicates):", pricesErr.message);
  console.log("✓ Prices inserted");

  // ── Recipes ───────────────────────────────────────────────────────────────
  const recipeData = [
    {
      name: "Pâtes à la carbonara",
      description: "La vraie carbonara romaine : sans crème, avec des œufs, lardons et parmesan. Prête en 20 min.",
      servings: 2,
      prep_time_minutes: 10,
      cook_time_minutes: 15,
      dietary_tags: [],
      ingredients: [
        { product_id: pMap["Pâtes rigatoni"],        custom_name: "Pâtes rigatoni",     quantity: 200, unit: "g",     sort_order: 0 },
        { product_id: pMap["Lardons fumés"],          custom_name: "Lardons fumés",      quantity: 150, unit: "g",     sort_order: 1 },
        { product_id: pMap["Œufs frais plein air (x6)"], custom_name: "Œufs",           quantity: 3,   unit: "pièce", sort_order: 2 },
        { product_id: pMap["Fromage râpé emmental"],  custom_name: "Parmesan râpé",      quantity: 80,  unit: "g",     sort_order: 3 },
        { product_id: null,                           custom_name: "Poivre noir",         quantity: 5,   unit: "g",     sort_order: 4 },
      ],
      steps: [
        "Cuire les pâtes al dente dans une grande casserole d'eau bouillante salée.",
        "Faire revenir les lardons à sec dans une poêle jusqu'à ce qu'ils soient dorés.",
        "Battre les œufs avec le parmesan râpé et généreusement poivrer.",
        "Hors du feu, mélanger les pâtes égouttées avec les lardons, puis ajouter le mélange œuf-parmesan. Remuer rapidement pour créer une crème onctueuse.",
      ],
    },
    {
      name: "Poulet rôti aux herbes de Provence",
      description: "Un classique du dimanche. Juteux à l'intérieur, croustillant à l'extérieur.",
      servings: 4,
      prep_time_minutes: 15,
      cook_time_minutes: 70,
      dietary_tags: ["gluten_free"],
      ingredients: [
        { product_id: pMap["Poulet entier fermier"],  custom_name: "Poulet entier",      quantity: 1500, unit: "g",    sort_order: 0 },
        { product_id: pMap["Beurre doux"],            custom_name: "Beurre",             quantity: 50,   unit: "g",    sort_order: 1 },
        { product_id: null,                           custom_name: "Herbes de Provence",  quantity: 10,   unit: "g",    sort_order: 2 },
        { product_id: null,                           custom_name: "Ail",                quantity: 4,    unit: "pièce", sort_order: 3 },
        { product_id: null,                           custom_name: "Citron",             quantity: 1,    unit: "pièce", sort_order: 4 },
      ],
      steps: [
        "Préchauffer le four à 200°C.",
        "Mélanger le beurre ramolli avec les herbes, sel et poivre. Glisser sous la peau du poulet.",
        "Farcir la cavité avec les gousses d'ail et le citron coupé en deux.",
        "Enfourner et cuire 70 min en arrosant toutes les 20 min avec le jus de cuisson.",
      ],
    },
    {
      name: "Saumon en papillote citron-aneth",
      description: "Cuisson vapeur dans du papier alu — le saumon reste fondant. Parfait avec du riz.",
      servings: 2,
      prep_time_minutes: 10,
      cook_time_minutes: 20,
      dietary_tags: ["gluten_free"],
      ingredients: [
        { product_id: pMap["Saumon atlantique"],      custom_name: "Filet de saumon",    quantity: 400,  unit: "g",   sort_order: 0 },
        { product_id: null,                           custom_name: "Citron",             quantity: 2,    unit: "pièce", sort_order: 1 },
        { product_id: null,                           custom_name: "Aneth",              quantity: 10,   unit: "g",   sort_order: 2 },
        { product_id: pMap["Beurre doux"],            custom_name: "Beurre",             quantity: 20,   unit: "g",   sort_order: 3 },
        { product_id: null,                           custom_name: "Sel, poivre",        quantity: 5,    unit: "g",   sort_order: 4 },
      ],
      steps: [
        "Préchauffer le four à 180°C.",
        "Déposer chaque filet de saumon sur un carré de papier alu. Ajouter le beurre, le citron en rondelles et l'aneth.",
        "Fermer hermétiquement les papillotes et enfourner 20 minutes.",
      ],
    },
    {
      name: "Riz au curry de légumes",
      description: "Plat végétarien parfumé et réconfortant. Lait de coco, curry et légumes de saison.",
      servings: 4,
      prep_time_minutes: 15,
      cook_time_minutes: 25,
      dietary_tags: ["vegetarian", "gluten_free"],
      ingredients: [
        { product_id: pMap["Riz basmati"],            custom_name: "Riz basmati",        quantity: 300,  unit: "g",   sort_order: 0 },
        { product_id: null,                           custom_name: "Lait de coco",       quantity: 400,  unit: "ml",  sort_order: 1 },
        { product_id: null,                           custom_name: "Curry en poudre",    quantity: 15,   unit: "g",   sort_order: 2 },
        { product_id: null,                           custom_name: "Courgette",          quantity: 2,    unit: "pièce", sort_order: 3 },
        { product_id: pMap["Tomates pelées au jus"],  custom_name: "Tomates pelées",     quantity: 400,  unit: "g",   sort_order: 4 },
        { product_id: null,                           custom_name: "Oignon",             quantity: 1,    unit: "pièce", sort_order: 5 },
      ],
      steps: [
        "Faire revenir l'oignon émincé à l'huile d'olive. Ajouter la courgette en dés.",
        "Ajouter le curry, mélanger 1 minute, puis verser les tomates et le lait de coco.",
        "Cuire 20 min à feu moyen. Servir avec le riz basmati cuit.",
      ],
    },
    {
      name: "Salade niçoise",
      description: "La salade complète du midi. Thon, œufs, tomates cerises, haricots verts et olives.",
      servings: 2,
      prep_time_minutes: 20,
      cook_time_minutes: 10,
      dietary_tags: ["gluten_free"],
      ingredients: [
        { product_id: pMap["Œufs frais plein air (x6)"], custom_name: "Œufs durs",      quantity: 2,    unit: "pièce", sort_order: 0 },
        { product_id: pMap["Tomates cerises"],        custom_name: "Tomates cerises",    quantity: 200,  unit: "g",   sort_order: 1 },
        { product_id: null,                           custom_name: "Thon en boîte",      quantity: 200,  unit: "g",   sort_order: 2 },
        { product_id: null,                           custom_name: "Haricots verts",     quantity: 150,  unit: "g",   sort_order: 3 },
        { product_id: null,                           custom_name: "Olives noires",      quantity: 50,   unit: "g",   sort_order: 4 },
        { product_id: null,                           custom_name: "Vinaigrette",        quantity: 30,   unit: "ml",  sort_order: 5 },
      ],
      steps: [
        "Cuire les œufs 10 min dans l'eau bouillante, puis les passer à l'eau froide.",
        "Cuire les haricots verts 5 min à l'eau bouillante salée.",
        "Dresser la salade : laitue, tomates cerises, haricots verts, thon égoutté, olives et œufs coupés en quartiers.",
        "Assaisonner de vinaigrette maison (moutarde, vinaigre, huile d'olive).",
      ],
    },
    {
      name: "Soupe à l'oignon gratinée",
      description: "La grande classique brasserie parisienne. Longue cuisson des oignons pour caraméliser.",
      servings: 4,
      prep_time_minutes: 20,
      cook_time_minutes: 60,
      dietary_tags: ["vegetarian"],
      ingredients: [
        { product_id: null,                           custom_name: "Oignons jaunes",     quantity: 800,  unit: "g",   sort_order: 0 },
        { product_id: pMap["Beurre doux"],            custom_name: "Beurre",             quantity: 50,   unit: "g",   sort_order: 1 },
        { product_id: null,                           custom_name: "Vin blanc sec",      quantity: 150,  unit: "ml",  sort_order: 2 },
        { product_id: null,                           custom_name: "Bouillon de légumes", quantity: 1200, unit: "ml", sort_order: 3 },
        { product_id: pMap["Fromage râpé emmental"],  custom_name: "Gruyère râpé",       quantity: 150,  unit: "g",   sort_order: 4 },
        { product_id: null,                           custom_name: "Pain de campagne",   quantity: 4,    unit: "tranche", sort_order: 5 },
      ],
      steps: [
        "Émincer finement les oignons. Les faire fondre avec le beurre à feu doux pendant 40 min jusqu'à caramélisation.",
        "Déglacer au vin blanc. Ajouter le bouillon et cuire 20 min.",
        "Verser dans des bols, poser une tranche de pain sur le dessus et couvrir de gruyère râpé.",
        "Gratiner au four à 220°C pendant 5-8 min.",
      ],
    },
    {
      name: "Omelette aux champignons et fines herbes",
      description: "Rapide, économique et nourrissant. Idéal pour un dîner léger de semaine.",
      servings: 2,
      prep_time_minutes: 10,
      cook_time_minutes: 10,
      dietary_tags: ["vegetarian", "gluten_free"],
      ingredients: [
        { product_id: pMap["Œufs frais plein air (x6)"], custom_name: "Œufs",           quantity: 4,    unit: "pièce", sort_order: 0 },
        { product_id: null,                           custom_name: "Champignons de Paris", quantity: 200, unit: "g",   sort_order: 1 },
        { product_id: pMap["Beurre doux"],            custom_name: "Beurre",             quantity: 20,   unit: "g",   sort_order: 2 },
        { product_id: null,                           custom_name: "Ciboulette fraîche", quantity: 10,   unit: "g",   sort_order: 3 },
      ],
      steps: [
        "Faire revenir les champignons émincés dans le beurre. Réserver.",
        "Battre les œufs avec sel, poivre et ciboulette.",
        "Cuire l'omelette dans la même poêle, ajouter les champignons et plier.",
      ],
    },
    {
      name: "Lentilles vertes mijotées aux carottes",
      description: "Plat complet et nourrissant, riche en protéines végétales. Idéal en hiver.",
      servings: 4,
      prep_time_minutes: 10,
      cook_time_minutes: 35,
      dietary_tags: ["vegetarian", "vegan", "gluten_free"],
      ingredients: [
        { product_id: pMap["Lentilles vertes du Puy"], custom_name: "Lentilles vertes", quantity: 400, unit: "g",    sort_order: 0 },
        { product_id: null,                           custom_name: "Carottes",           quantity: 3,    unit: "pièce", sort_order: 1 },
        { product_id: pMap["Tomates pelées au jus"],  custom_name: "Tomates pelées",     quantity: 400,  unit: "g",   sort_order: 2 },
        { product_id: null,                           custom_name: "Oignon",             quantity: 1,    unit: "pièce", sort_order: 3 },
        { product_id: null,                           custom_name: "Cumin",              quantity: 5,    unit: "g",   sort_order: 4 },
        { product_id: null,                           custom_name: "Thym",               quantity: 5,    unit: "g",   sort_order: 5 },
      ],
      steps: [
        "Faire revenir l'oignon et les carottes coupées en rondelles dans l'huile d'olive.",
        "Ajouter les lentilles rincées, les tomates et le cumin. Couvrir d'eau (double volume).",
        "Cuire à feu moyen 30-35 min jusqu'à ce que les lentilles soient tendres. Ajuster l'assaisonnement.",
      ],
    },
    {
      name: "Crêpes sucrées maison",
      description: "La recette de base pour un dimanche en famille. Légères et dorées à souhait.",
      servings: 4,
      prep_time_minutes: 10,
      cook_time_minutes: 20,
      dietary_tags: ["vegetarian"],
      ingredients: [
        { product_id: pMap["Farine de blé T55"],      custom_name: "Farine",             quantity: 250,  unit: "g",   sort_order: 0 },
        { product_id: pMap["Lait demi-écrémé"],       custom_name: "Lait",               quantity: 500,  unit: "ml",  sort_order: 1 },
        { product_id: pMap["Œufs frais plein air (x6)"], custom_name: "Œufs",            quantity: 3,    unit: "pièce", sort_order: 2 },
        { product_id: pMap["Beurre doux"],            custom_name: "Beurre",             quantity: 30,   unit: "g",   sort_order: 3 },
        { product_id: null,                           custom_name: "Sucre vanillé",      quantity: 10,   unit: "g",   sort_order: 4 },
      ],
      steps: [
        "Mélanger la farine et les œufs, puis incorporer le lait progressivement pour éviter les grumeaux.",
        "Ajouter le beurre fondu et le sucre vanillé. Laisser reposer 30 min.",
        "Cuire les crêpes dans une poêle chaude légèrement beurrée, 1-2 min de chaque côté.",
      ],
    },
    {
      name: "Tarte aux tomates et moutarde",
      description: "Entrée rapide et savoureuse. Pâte feuilletée, moutarde, gruyère, tomates.",
      servings: 4,
      prep_time_minutes: 15,
      cook_time_minutes: 25,
      dietary_tags: ["vegetarian"],
      ingredients: [
        { product_id: null,                           custom_name: "Pâte feuilletée",    quantity: 1,    unit: "rouleau", sort_order: 0 },
        { product_id: pMap["Tomates cerises"],        custom_name: "Tomates",            quantity: 400,  unit: "g",   sort_order: 1 },
        { product_id: null,                           custom_name: "Moutarde de Dijon",  quantity: 30,   unit: "g",   sort_order: 2 },
        { product_id: pMap["Fromage râpé emmental"],  custom_name: "Gruyère râpé",       quantity: 100,  unit: "g",   sort_order: 3 },
        { product_id: null,                           custom_name: "Basilic frais",      quantity: 10,   unit: "g",   sort_order: 4 },
      ],
      steps: [
        "Préchauffer le four à 200°C. Étaler la pâte sur un plat.",
        "Tartiner de moutarde, parsemer de gruyère, disposer les tomates tranchées.",
        "Cuire 25 min jusqu'à ce que les bords soient dorés. Garnir de basilic frais.",
      ],
    },
    {
      name: "Gratin dauphinois",
      description: "Le grand classique savoyard. Crémeux, fondant, parfumé à la muscade.",
      servings: 6,
      prep_time_minutes: 20,
      cook_time_minutes: 75,
      dietary_tags: ["vegetarian", "gluten_free"],
      ingredients: [
        { product_id: null,                           custom_name: "Pommes de terre",    quantity: 1200, unit: "g",   sort_order: 0 },
        { product_id: pMap["Crème fraîche épaisse"],  custom_name: "Crème fraîche",      quantity: 400,  unit: "ml",  sort_order: 1 },
        { product_id: pMap["Lait demi-écrémé"],       custom_name: "Lait",               quantity: 200,  unit: "ml",  sort_order: 2 },
        { product_id: null,                           custom_name: "Ail",                quantity: 2,    unit: "pièce", sort_order: 3 },
        { product_id: null,                           custom_name: "Muscade",            quantity: 3,    unit: "g",   sort_order: 4 },
      ],
      steps: [
        "Préchauffer le four à 180°C. Frotter le plat avec l'ail.",
        "Éplucher et couper les pommes de terre en rondelles fines. Assaisonner sel, poivre, muscade.",
        "Mélanger lait et crème, verser sur les pommes de terre disposées en couches.",
        "Cuire 75 min jusqu'à ce que les pommes de terre soient fondantes et dorées.",
      ],
    },
    {
      name: "Bowl avocat-œuf-saumon",
      description: "Bowl nutritif et équilibré. Protéines, bonnes graisses, légumes frais.",
      servings: 1,
      prep_time_minutes: 15,
      cook_time_minutes: 10,
      dietary_tags: ["gluten_free"],
      ingredients: [
        { product_id: pMap["Saumon atlantique"],      custom_name: "Saumon fumé",        quantity: 100,  unit: "g",   sort_order: 0 },
        { product_id: pMap["Œufs frais plein air (x6)"], custom_name: "Œuf poché",       quantity: 1,    unit: "pièce", sort_order: 1 },
        { product_id: null,                           custom_name: "Avocat",             quantity: 1,    unit: "pièce", sort_order: 2 },
        { product_id: pMap["Tomates cerises"],        custom_name: "Tomates cerises",    quantity: 100,  unit: "g",   sort_order: 3 },
        { product_id: null,                           custom_name: "Roquette",           quantity: 50,   unit: "g",   sort_order: 4 },
        { product_id: null,                           custom_name: "Graines de sésame",  quantity: 10,   unit: "g",   sort_order: 5 },
      ],
      steps: [
        "Pocher l'œuf 3 min dans l'eau frémissante avec un filet de vinaigre.",
        "Disposer la roquette dans le bowl, ajouter l'avocat en tranches, les tomates, le saumon.",
        "Poser l'œuf poché, parsemer de sésame, assaisonner d'huile d'olive et fleur de sel.",
      ],
    },
  ];

  const insertedRecipes = [];
  for (const r of recipeData) {
    const { data: rec, error: recErr } = await supabase.from("recipes").insert({
      user_id: uid,
      name: r.name,
      description: r.description,
      servings: r.servings,
      prep_time_minutes: r.prep_time_minutes,
      cook_time_minutes: r.cook_time_minutes,
      dietary_tags: r.dietary_tags,
    }).select("id").single();
    if (recErr) { console.error("Recipe error:", recErr.message); continue; }

    const ingRows = r.ingredients.map((ing) => ({ ...ing, recipe_id: rec.id }));
    await supabase.from("recipe_ingredients").insert(ingRows);

    const stepRows = r.steps.map((desc, i) => ({ recipe_id: rec.id, step_number: i + 1, description: desc }));
    await supabase.from("recipe_steps").insert(stepRows);

    insertedRecipes.push({ id: rec.id, name: r.name });
  }
  console.log("✓ Recipes:", insertedRecipes.length);

  const recipeByName = Object.fromEntries(insertedRecipes.map((r) => [r.name, r.id]));

  // ── Meal plans ────────────────────────────────────────────────────────────
  const thisMonday  = getMondayOf(new Date());
  const lastMonday  = addWeeks(thisMonday, -1);
  const twoAgoMonday = addWeeks(thisMonday, -2);

  const weeks = [
    { date: twoAgoMonday, slots: [
      { day: 1, meal: "lunch",   recipe: "Pâtes à la carbonara" },
      { day: 1, meal: "dinner",  recipe: "Soupe à l'oignon gratinée" },
      { day: 2, meal: "lunch",   recipe: "Salade niçoise" },
      { day: 2, meal: "dinner",  recipe: "Saumon en papillote citron-aneth" },
      { day: 3, meal: "lunch",   recipe: "Riz au curry de légumes" },
      { day: 3, meal: "dinner",  recipe: "Omelette aux champignons et fines herbes" },
      { day: 4, meal: "lunch",   recipe: "Lentilles vertes mijotées aux carottes" },
      { day: 4, meal: "dinner",  recipe: "Poulet rôti aux herbes de Provence" },
      { day: 5, meal: "lunch",   recipe: "Tarte aux tomates et moutarde" },
      { day: 5, meal: "dinner",  recipe: "Gratin dauphinois" },
      { day: 6, meal: "lunch",   recipe: "Bowl avocat-œuf-saumon" },
      { day: 7, meal: "dinner",  recipe: "Crêpes sucrées maison" },
    ]},
    { date: lastMonday, slots: [
      { day: 1, meal: "breakfast", recipe: "Crêpes sucrées maison" },
      { day: 1, meal: "lunch",     recipe: "Poulet rôti aux herbes de Provence" },
      { day: 1, meal: "dinner",    recipe: "Pâtes à la carbonara" },
      { day: 2, meal: "lunch",     recipe: "Riz au curry de légumes" },
      { day: 2, meal: "dinner",    recipe: "Gratin dauphinois" },
      { day: 3, meal: "lunch",     recipe: "Bowl avocat-œuf-saumon" },
      { day: 3, meal: "dinner",    recipe: "Saumon en papillote citron-aneth" },
      { day: 4, meal: "lunch",     recipe: "Lentilles vertes mijotées aux carottes" },
      { day: 4, meal: "dinner",    recipe: "Soupe à l'oignon gratinée" },
      { day: 5, meal: "lunch",     recipe: "Omelette aux champignons et fines herbes" },
      { day: 5, meal: "dinner",    recipe: "Tarte aux tomates et moutarde" },
      { day: 6, meal: "breakfast", recipe: "Crêpes sucrées maison" },
      { day: 6, meal: "lunch",     recipe: "Salade niçoise" },
      { day: 7, meal: "lunch",     recipe: "Poulet rôti aux herbes de Provence" },
      { day: 7, meal: "dinner",    recipe: "Gratin dauphinois" },
    ]},
    { date: thisMonday, slots: [
      { day: 1, meal: "breakfast", recipe: "Crêpes sucrées maison" },
      { day: 1, meal: "lunch",     recipe: "Salade niçoise" },
      { day: 1, meal: "dinner",    recipe: "Pâtes à la carbonara" },
      { day: 2, meal: "lunch",     recipe: "Riz au curry de légumes" },
      { day: 2, meal: "dinner",    recipe: "Saumon en papillote citron-aneth" },
      { day: 3, meal: "lunch",     recipe: "Bowl avocat-œuf-saumon" },
      { day: 3, meal: "dinner",    recipe: "Lentilles vertes mijotées aux carottes" },
      { day: 4, meal: "lunch",     recipe: "Omelette aux champignons et fines herbes" },
      { day: 4, meal: "dinner",    recipe: "Soupe à l'oignon gratinée" },
      { day: 5, meal: "lunch",     recipe: "Poulet rôti aux herbes de Provence" },
      { day: 5, meal: "dinner",    recipe: "Gratin dauphinois" },
      { day: 6, meal: "lunch",     recipe: "Tarte aux tomates et moutarde" },
      { day: 7, meal: "lunch",     recipe: "Poulet rôti aux herbes de Provence" },
      { day: 7, meal: "dinner",    recipe: "Crêpes sucrées maison" },
    ]},
  ];

  for (const week of weeks) {
    const { data: plan, error: planErr } = await supabase.from("meal_plans").upsert({
      user_id: uid,
      week_start: fmt(week.date),
    }, { onConflict: "user_id,week_start" }).select("id").single();
    if (planErr) { console.error("Plan error:", planErr.message); continue; }

    const slotRows = week.slots
      .filter((s) => recipeByName[s.recipe])
      .map((s) => ({
        meal_plan_id: plan.id,
        day_of_week: s.day,
        meal_type: s.meal,
        recipe_id: recipeByName[s.recipe],
        servings: 2,
      }));

    await supabase.from("meal_slots").delete().eq("meal_plan_id", plan.id);
    const { error: slotsErr } = await supabase.from("meal_slots").insert(slotRows);
    if (slotsErr) console.warn("Slots:", slotsErr.message);
  }
  console.log("✓ Meal plans: 3 weeks populated");

  // ── Shopping list (active) ────────────────────────────────────────────────
  // Archive any existing active lists first
  await supabase.from("shopping_lists").update({ status: "archived" }).eq("user_id", uid).eq("status", "active");

  const { data: shoppingList, error: slErr } = await supabase.from("shopping_lists").insert({
    user_id: uid,
    name: "Courses de la semaine",
    status: "active",
  }).select("id").single();
  if (slErr) throw slErr;

  const shoppingItems = [
    { custom_name: "Pâtes rigatoni",      product_id: pMap["Pâtes rigatoni"],        quantity: 500, unit: "g",     is_checked: false, sort_order: 0, category: "Épicerie sèche" },
    { custom_name: "Saumon",              product_id: pMap["Saumon atlantique"],      quantity: 400, unit: "g",     is_checked: false, sort_order: 1, category: "Viandes & Poissons" },
    { custom_name: "Œufs",               product_id: pMap["Œufs frais plein air (x6)"], quantity: 6, unit: "pièce", is_checked: false, sort_order: 2, category: "Produits laitiers" },
    { custom_name: "Lardons fumés",       product_id: pMap["Lardons fumés"],          quantity: 200, unit: "g",     is_checked: true,  sort_order: 3, category: "Viandes & Poissons" },
    { custom_name: "Riz basmati",         product_id: pMap["Riz basmati"],            quantity: 500, unit: "g",     is_checked: false, sort_order: 4, category: "Épicerie sèche" },
    { custom_name: "Lentilles vertes",    product_id: pMap["Lentilles vertes du Puy"], quantity: 400, unit: "g",     is_checked: false, sort_order: 5, category: "Épicerie sèche" },
    { custom_name: "Crème fraîche",       product_id: pMap["Crème fraîche épaisse"],  quantity: 200, unit: "ml",    is_checked: true,  sort_order: 6, category: "Produits laitiers" },
    { custom_name: "Tomates cerises",     product_id: pMap["Tomates cerises"],        quantity: 500, unit: "g",     is_checked: false, sort_order: 7, category: "Fruits & Légumes" },
    { custom_name: "Fromage râpé",        product_id: pMap["Fromage râpé emmental"],  quantity: 200, unit: "g",     is_checked: false, sort_order: 8, category: "Produits laitiers" },
    { custom_name: "Lait",               product_id: pMap["Lait demi-écrémé"],        quantity: 1000, unit: "ml",   is_checked: true,  sort_order: 9, category: "Produits laitiers" },
    { custom_name: "Citrons",            product_id: null,                             quantity: 3,   unit: "pièce", is_checked: false, sort_order: 10, category: "Fruits & Légumes" },
    { custom_name: "Avocat",             product_id: null,                             quantity: 2,   unit: "pièce", is_checked: false, sort_order: 11, category: "Fruits & Légumes" },
  ];

  const { error: itemsErr } = await supabase.from("shopping_items").insert(
    shoppingItems.map((item) => ({ ...item, shopping_list_id: shoppingList.id }))
  );
  if (itemsErr) console.error("Shopping items:", itemsErr.message);
  console.log("✓ Shopping list: active with", shoppingItems.length, "items");

  // ── Pantry ────────────────────────────────────────────────────────────────
  const today = new Date();
  const d = (n: number) => { const r = new Date(today); r.setDate(r.getDate() + n); return fmt(r); };

  const pantryItems = [
    { user_id: uid, custom_name: "Riz basmati",       product_id: pMap["Riz basmati"],            quantity: 800,  unit: "g",     location: "pantry",  expiry_date: d(90) },
    { user_id: uid, custom_name: "Pâtes rigatoni",    product_id: pMap["Pâtes rigatoni"],          quantity: 500,  unit: "g",     location: "pantry",  expiry_date: d(180) },
    { user_id: uid, custom_name: "Lentilles vertes",  product_id: pMap["Lentilles vertes du Puy"], quantity: 600,  unit: "g",     location: "pantry",  expiry_date: d(365) },
    { user_id: uid, custom_name: "Tomates pelées",    product_id: pMap["Tomates pelées au jus"],   quantity: 400,  unit: "g",     location: "pantry",  expiry_date: d(200) },
    { user_id: uid, custom_name: "Farine T55",        product_id: pMap["Farine de blé T55"],       quantity: 750,  unit: "g",     location: "pantry",  expiry_date: d(120) },
    { user_id: uid, custom_name: "Beurre doux",       product_id: pMap["Beurre doux"],             quantity: 200,  unit: "g",     location: "fridge",  expiry_date: d(21) },
    { user_id: uid, custom_name: "Lait demi-écrémé",  product_id: pMap["Lait demi-écrémé"],        quantity: 1000, unit: "ml",    location: "fridge",  expiry_date: d(7) },
    { user_id: uid, custom_name: "Œufs",              product_id: pMap["Œufs frais plein air (x6)"], quantity: 6,  unit: "pièce", location: "fridge",  expiry_date: d(14) },
    { user_id: uid, custom_name: "Saumon fumé",       product_id: pMap["Saumon atlantique"],        quantity: 200, unit: "g",     location: "fridge",  expiry_date: d(4) },
    { user_id: uid, custom_name: "Fromage râpé",      product_id: pMap["Fromage râpé emmental"],   quantity: 150,  unit: "g",     location: "fridge",  expiry_date: d(10) },
    { user_id: uid, custom_name: "Poulet haché",      product_id: null,                            quantity: 300,  unit: "g",     location: "freezer", expiry_date: d(60) },
    { user_id: uid, custom_name: "Petits pois",       product_id: null,                            quantity: 500,  unit: "g",     location: "freezer", expiry_date: d(180) },
    { user_id: uid, custom_name: "Crème fraîche",     product_id: pMap["Crème fraîche épaisse"],   quantity: 100,  unit: "ml",    location: "fridge",  expiry_date: d(3) },
    { user_id: uid, custom_name: "Ail",               product_id: null,                            quantity: 5,    unit: "pièce", location: "pantry",  expiry_date: null },
  ];

  const { error: pantryErr } = await supabase.from("pantry_items").insert(pantryItems);
  if (pantryErr) console.error("Pantry:", pantryErr.message);
  console.log("✓ Pantry:", pantryItems.length, "items");

  console.log("\n🎉 Done! Account populated for clementmuth@gmail.com");
}

run().catch(console.error);
