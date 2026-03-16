import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qccvwajldbzykeekypzc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjY3Z3YWpsZGJ6eWtlZWt5cHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk5MDQyNCwiZXhwIjoyMDg4NTY2NDI0fQ.MBwwrqtvSLIiDof-pFN9Ah-8W_g6hXmw1pCnUtBrpLM",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const updates = [
  { name: "Spaghetti n°5",              nova_group: 1, allergens_tags: ["en:gluten"], additives_tags: [] },
  { name: "Steak haché 15% MG",         nova_group: 1, allergens_tags: [], additives_tags: [] },
  { name: "Tomates concassées",         nova_group: 2, allergens_tags: [], additives_tags: ["en:e330"] },
  { name: "Oignon jaune",               nova_group: 1, allergens_tags: [], additives_tags: [] },
  { name: "Ail",                        nova_group: 1, allergens_tags: [], additives_tags: [] },
  { name: "Huile d'olive vierge extra", nova_group: 1, allergens_tags: [], additives_tags: [] },
];

for (const { name, ...data } of updates) {
  const { error } = await supabase.from("products").update(data).eq("name", name);
  if (error) console.error(`Erreur ${name}:`, error.message);
  else console.log(`✓ ${name}`);
}
console.log("Done");
