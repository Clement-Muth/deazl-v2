import { getLocale } from "@/lib/i18n/server";
import { OnboardingLayoutClient } from "./_components/onboardingLayoutClient";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return <OnboardingLayoutClient locale={locale}>{children}</OnboardingLayoutClient>;
}
