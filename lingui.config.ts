import { defineConfig } from "@lingui/conf";

export default defineConfig({
  sourceLocale: "en",
  locales: ["en", "fr"],
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src/**"],
    },
  ],
  format: "po",
  compileNamespace: "es",
});
