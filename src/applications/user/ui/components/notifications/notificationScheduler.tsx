"use client";

import { useEffect } from "react";

const STORAGE_KEY = "deazl_notif_v2";

export function NotificationScheduler() {
  useEffect(() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) return;

    async function schedule() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        const { display } = await LocalNotifications.requestPermissions();
        if (display !== "granted") return;

        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1001,
              title: "Planifie ta semaine 🗓️",
              body: "C'est dimanche ! Prépare tes repas pour toute la semaine.",
              schedule: { on: { weekday: 1, hour: 19, minute: 0 }, repeats: true },
            },
            {
              id: 1002,
              title: "Liste de courses prête ?",
              body: "N'oublie pas de générer ta liste avant de faire les courses.",
              schedule: { on: { weekday: 6, hour: 10, minute: 0 }, repeats: true },
            },
            {
              id: 1003,
              title: "Début de semaine 🥗",
              body: "Ton planning de repas t'attend. Bonne semaine !",
              schedule: { on: { weekday: 2, hour: 8, minute: 0 }, repeats: true },
            },
          ],
        });

        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // silently ignore — native only
      }
    }

    schedule();
  }, []);

  return null;
}
