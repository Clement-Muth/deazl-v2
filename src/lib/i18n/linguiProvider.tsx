"use client";

import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import { useEffect, type ReactNode } from "react";
import { type Locale, loadCatalog } from "./i18n";

export function LinguiProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  useEffect(() => {
    loadCatalog(locale);
  }, [locale]);

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}
