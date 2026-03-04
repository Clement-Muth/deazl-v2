"use server";

import { createClient } from "@/lib/supabase/server";

export interface UserStoreItem {
  id: string;
  name: string;
  brand: string;
  city: string;
}

export async function getUserStores(): Promise<UserStoreItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_stores")
    .select("stores(id, name, brand, city)")
    .eq("user_id", user.id);

  return (data ?? [])
    .flatMap((row) => (Array.isArray(row.stores) ? row.stores : row.stores ? [row.stores] : []))
    .filter(Boolean) as unknown as UserStoreItem[];
}
