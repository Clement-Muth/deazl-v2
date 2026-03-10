import { supabase } from "../../../../lib/supabase";

export interface UserStore {
  id: string;
  name: string;
  brand: string | null;
  city: string;
}

export async function getUserStores(): Promise<UserStore[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_stores")
    .select("store_id, stores(id, name, brand, city)")
    .eq("user_id", user.id);

  return (data ?? [])
    .map((us) => {
      const store = Array.isArray(us.stores) ? us.stores[0] : us.stores;
      return store as UserStore | null;
    })
    .filter((s): s is UserStore => !!s);
}
