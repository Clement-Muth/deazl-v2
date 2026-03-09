import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { setupI18n, type Messages } from "@lingui/core";
import { setI18n } from "@lingui/react/server";
import { type Locale, locales, defaultLocale } from "./i18n";

const getI18nInstance = cache(async (locale: Locale) => {
  const mod = await import(`../../locales/${locale}/messages`);
  const messages = mod.messages ?? mod.default?.messages ?? {};
  return setupI18n({ locale, messages: { [locale]: messages } });
});

export const getMessages = cache(async (locale: Locale) => {
  const mod = await import(`../../locales/${locale}/messages`);
  return (mod.messages ?? mod.default?.messages ?? {}) as Messages;
});

export async function initLingui(locale: Locale) {
  const i18n = await getI18nInstance(locale);
  setI18n(i18n);
  return i18n;
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("deazl_locale")?.value as Locale | undefined;
  return cookieLocale && locales.includes(cookieLocale) ? cookieLocale : defaultLocale;
}

export async function initLinguiFromCookie() {
  return initLingui(await getLocale());
}
