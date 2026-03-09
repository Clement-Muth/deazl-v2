"use client";

import { I18nProvider } from "@lingui/react";
import { setupI18n, type Messages } from "@lingui/core";
import { useMemo } from "react";
import type { Locale } from "./i18n";

export function LinguiClientProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const i18n = useMemo(
    () => setupI18n({ locale, messages: { [locale]: messages } }),
    [locale]
  );
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}
