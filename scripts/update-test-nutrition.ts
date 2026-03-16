import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qccvwajldbzykeekypzc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjY3Z3YWpsZGJ6eWtlZWt5cHpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk5MDQyNCwiZXhwIjoyMDg4NTY2NDI0fQ.MBwwrqtvSLIiDof-pFN9Ah-8W_g6hXmw1pCnUtBrpLM",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const updates = [
  { name: "Spaghetti n°5",              sugars_100g: 3.5,  saturated_fat_100g: 0.3  },
  { name: "Steak haché 15% MG",         sugars_100g: 0,    saturated_fat_100g: 7.5  },
  { name: "Tomates concassées",         sugars_100g: 3.8,  saturated_fat_100g: 0.03 },
  { name: "Oignon jaune",               sugars_100g: 5.3,  saturated_fat_100g: 0.01 },
  { name: "Ail",                        sugars_100g: 1,    saturated_fat_100g: 0.09 },
  { name: "Huile d'olive vierge extra", sugars_100g: 0,    saturated_fat_100g: 14   },
];

for (const { name, ...data } of updates) {
  const { error } = await supabase.from("products").update(data).eq("name", name);
  if (error) console.error(`Erreur ${name}:`, error.message);
  else console.log(`✓ ${name}`);
}
console.log("Done");
