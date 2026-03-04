import type { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.NODE_ENV !== "production";

const config: CapacitorConfig = {
  appId: "app.deazl.v2",
  appName: "Deazl",
  webDir: "out",
  server: isDev
    ? {
        url: "http://192.168.1.39:3002",
        cleartext: true,
      }
    : {},
  plugins: {},
};

export default config;
