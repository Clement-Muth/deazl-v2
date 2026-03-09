import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qccvwajldbzykeekypzc.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MAIN_USER_EMAIL = "clementmuth@gmail.com";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PANTRY_ITEMS: Array<{
  custom_name: string;
  quantity: number | null;
  unit: string | null;
  location: string;
  expiry_date: string | null;
}> = [
  { custom_name: "Tomates", quantity: 4, unit: "pièce", location: "fridge", expiry_date: "2026-03-15" },
  { custom_name: "Oignon", quantity: 3, unit: "pièce", location: "pantry", expiry_date: null },
  { custom_name: "Ail", quantity: 1, unit: "tête", location: "pantry", expiry_date: null },
  { custom_name: "Oeufs", quantity: 6, unit: "pièce", location: "fridge", expiry_date: "2026-03-20" },
  { custom_name: "Lardons", quantity: 200, unit: "g", location: "fridge", expiry_date: "2026-03-12" },
  { custom_name: "Parmesan", quantity: 100, unit: "g", location: "fridge", expiry_date: "2026-03-25" },
  { custom_name: "Pâtes", quantity: 500, unit: "g", location: "pantry", expiry_date: null },
  { custom_name: "Riz", quantity: 1, unit: "kg", location: "pantry", expiry_date: null },
  { custom_name: "Farine", quantity: 500, unit: "g", location: "pantry", expiry_date: null },
  { custom_name: "Sucre", quantity: 500, unit: "g", location: "pantry", expiry_date: null },
  { custom_name: "Beurre", quantity: 250, unit: "g", location: "fridge", expiry_date: "2026-04-01" },
  { custom_name: "Lait", quantity: 1, unit: "L", location: "fridge", expiry_date: "2026-03-14" },
  { custom_name: "Courgette", quantity: 2, unit: "pièce", location: "fridge", expiry_date: "2026-03-16" },
  { custom_name: "Aubergine", quantity: 1, unit: "pièce", location: "fridge", expiry_date: "2026-03-16" },
  { custom_name: "Pommes de terre", quantity: 1, unit: "kg", location: "pantry", expiry_date: null },
  { custom_name: "Carottes", quantity: 4, unit: "pièce", location: "fridge", expiry_date: "2026-03-20" },
  { custom_name: "Citron", quantity: 2, unit: "pièce", location: "fridge", expiry_date: "2026-03-18" },
  { custom_name: "Huile d'olive", quantity: null, unit: null, location: "pantry", expiry_date: null },
  { custom_name: "Sel", quantity: null, unit: null, location: "pantry", expiry_date: null },
  { custom_name: "Poivre", quantity: null, unit: null, location: "pantry", expiry_date: null },
  { custom_name: "Poulet", quantity: 1, unit: "pièce", location: "fridge", expiry_date: "2026-03-11" },
  { custom_name: "Thym", quantity: null, unit: null, location: "pantry", expiry_date: null },
  { custom_name: "Romarin", quantity: null, unit: null, location: "pantry", expiry_date: null },
  { custom_name: "Gruyère", quantity: 200, unit: "g", location: "fridge", expiry_date: "2026-03-22" },
  { custom_name: "Crème fraîche", quantity: 200, unit: "mL", location: "fridge", expiry_date: "2026-03-14" },
];

async function main() {
  const { data: users, error: usersError } = await admin.auth.admin.listUsers();
  if (usersError) { console.error("Error fetching users:", usersError); process.exit(1); }

  const mainUser = users.users.find((u) => u.email === MAIN_USER_EMAIL);
  if (!mainUser) { console.error("Main user not found"); process.exit(1); }

  console.log(`Adding pantry items for user: ${mainUser.email} (${mainUser.id})`);

  const { error } = await admin.from("pantry_items").insert(
    PANTRY_ITEMS.map((item) => ({ ...item, user_id: mainUser.id }))
  );

  if (error) { console.error("Error inserting pantry items:", error); process.exit(1); }

  console.log(`✓ Added ${PANTRY_ITEMS.length} pantry items`);

  const { error: imgError } = await admin
    .from("recipes")
    .update({ image_url: "https://images.unsplash.com/photo-1606851091851-e8c8d7b8dc74?w=800&q=80" })
    .eq("user_id", mainUser.id)
    .ilike("name", "%poulet rôti%");

  if (imgError) {
    console.error("Error fixing poulet image:", imgError);
  } else {
    console.log("✓ Fixed poulet rôti au citron image");
  }
}

main();
