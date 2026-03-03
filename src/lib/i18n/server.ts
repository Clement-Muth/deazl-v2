import { setupI18n } from "@lingui/core";
import { type Locale, defaultLocale } from "./i18n";

async function getMessages(locale: Locale) {
  const { messages } = await import(`../../locales/${locale}/messages`);
  return messages;
}

export async function getT(locale: Locale = defaultLocale) {
  const messages = await getMessages(locale);
  const i18n = setupI18n({ locale, messages: { [locale]: messages } });
  i18n.activate(locale);
  return i18n.t.bind(i18n);
}
