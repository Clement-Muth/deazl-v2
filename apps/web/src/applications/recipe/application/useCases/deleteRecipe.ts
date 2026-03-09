"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function deleteRecipe(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("recipes").delete().eq("id", id);
  redirect("/recipes");
}
