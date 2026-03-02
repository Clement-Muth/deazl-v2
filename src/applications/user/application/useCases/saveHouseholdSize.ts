"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function saveHouseholdSize(formData: FormData) {
  const supabase = await createClient();
  const size = formData.get("size") as string;

  const { error } = await supabase.auth.updateUser({
    data: { household_size: parseInt(size) },
  });

  if (error) {
    redirect("/onboarding/household?error=true");
  }

  redirect("/onboarding/stores");
}
