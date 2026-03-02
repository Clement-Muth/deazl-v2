"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const stores = formData.getAll("stores") as string[];

  const { error } = await supabase.auth.updateUser({
    data: {
      favorite_stores: stores,
      onboarding_completed: true,
    },
  });

  if (error) {
    redirect("/onboarding/stores?error=true");
  }

  redirect("/planning");
}
