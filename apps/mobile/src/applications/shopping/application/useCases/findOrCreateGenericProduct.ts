import { supabase } from "../../../../lib/supabase";

export async function findOrCreateGenericProduct(name: string): Promise<string | null> {
  const lowerName = name.toLowerCase().trim();

  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .is("off_id", null)
    .ilike("name", lowerName)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("products")
    .insert({ name: lowerName, off_id: null, unit: "pièce" })
    .select("id")
    .single();

  return created?.id ?? null;
}
