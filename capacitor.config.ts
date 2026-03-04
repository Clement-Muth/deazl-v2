import type { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.NODE_ENV !== "production";

const config: CapacitorConfig = {
  appId: "app.deazl.v2",
  appName: "Deazl",
  webDir: "out",
  server: {
    url: isDev ? "http://192.168.1.39:3002" : "https://deazl-v2.vercel.app",
    cleartext: isDev,
  },
  plugins: {},
};

export default config;
