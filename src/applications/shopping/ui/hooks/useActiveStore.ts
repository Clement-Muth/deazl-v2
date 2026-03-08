"use client";

import { useEffect, useState } from "react";
import { getUserStores } from "@/applications/user/application/useCases/getUserStores";
import type { UserStoreItem } from "@/applications/user/application/useCases/getUserStores";

const STORAGE_KEY = "deazl_active_store_id";

export function useActiveStore() {
  const [stores, setStores] = useState<UserStoreItem[]>([]);
  const [activeStore, setActiveStoreState] = useState<UserStoreItem | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getUserStores().then((s) => {
      setStores(s);
      const savedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const found = savedId ? s.find((store) => store.id === savedId) ?? null : null;
      setActiveStoreState(found);
      setLoaded(true);
    });
  }, []);

  function setActiveStore(store: UserStoreItem | null) {
    setActiveStoreState(store);
    if (store) {
      localStorage.setItem(STORAGE_KEY, store.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return { stores, activeStore, setActiveStore, loaded };
}
