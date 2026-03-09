"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateHouseholdSize(size: number): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.updateUser({ data: { household_size: size } });
  revalidatePath("/profile");
}
