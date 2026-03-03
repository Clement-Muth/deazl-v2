import { setupI18n } from "@lingui/core";
import { type Locale, defaultLocale } from "./i18n";

export async function getMessages(locale: Locale = defaultLocale) {
  const mod = await import(`../../locales/${locale}/messages`);
  return (mod.messages ?? mod.default?.messages ?? {}) as Record<string, string>;
}

export async function getT(locale: Locale = defaultLocale) {
  const messages = await getMessages(locale);
  const i18n = setupI18n({ locale, messages: { [locale]: messages } });
  i18n.activate(locale);
  return i18n.t.bind(i18n);
}
