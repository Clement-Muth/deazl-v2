"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function completeOnboarding(storeIds: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (storeIds.length > 0) {
    await supabase
      .from("user_stores")
      .upsert(
        storeIds.map((store_id) => ({ user_id: user.id, store_id })),
        { onConflict: "user_id,store_id" },
      );
  }

  await supabase.auth.updateUser({ data: { onboarding_completed: true } });

  redirect("/planning");
}
