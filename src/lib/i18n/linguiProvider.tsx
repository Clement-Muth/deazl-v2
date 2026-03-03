"use client";

import { I18nProvider } from "@lingui/react";
import { i18n } from "@lingui/core";
import type { ReactNode } from "react";
import type { Locale } from "./i18n";

type Messages = Record<string, string>;

export function LinguiProvider({ locale, messages, children }: { locale: Locale; messages: Messages; children: ReactNode }) {
  i18n.loadAndActivate({ locale, messages });
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}
