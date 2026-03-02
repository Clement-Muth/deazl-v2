import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.deazl.v2",
  appName: "Deazl",
  webDir: "out", // Next.js static export output
  server: {
    // En dev : pointe vers le serveur Next.js local
    // Commenter pour le build de production
    // url: "http://192.168.x.x:3000",
    // cleartext: true,
  },
  plugins: {
    // À configurer au fur et à mesure des besoins natifs
  },
};

export default config;
