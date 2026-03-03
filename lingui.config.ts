import { defineConfig } from "@lingui/conf";

export default defineConfig({
  sourceLocale: "fr",
  locales: ["fr", "en"],
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src/**"],
    },
  ],
  format: "po",
});
