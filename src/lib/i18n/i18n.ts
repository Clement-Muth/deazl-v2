import { i18n } from "@lingui/core";

export type Locale = "fr" | "en";
export const defaultLocale: Locale = "fr";

export async function loadCatalog(locale: Locale) {
  const { messages } = await import(`../../locales/${locale}/messages`);
  i18n.load(locale, messages);
  i18n.activate(locale);
}

export { i18n };
