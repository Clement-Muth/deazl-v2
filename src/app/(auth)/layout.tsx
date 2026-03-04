import { Trans } from "@lingui/react/macro";
import { getLocale, initLingui } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/shared/components/languageSwitcher";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  await initLingui(locale);

  return (
    <div className="relative flex min-h-screen flex-col bg-white sm:items-center sm:justify-center sm:bg-gray-50 sm:p-4">
      <div className="absolute right-5 top-5 z-10">
        <LanguageSwitcher current={locale} />
      </div>

      <div className="flex flex-1 flex-col px-6 pt-16 pb-10 sm:flex-none sm:w-full sm:max-w-sm sm:rounded-2xl sm:bg-white sm:px-8 sm:py-8 sm:shadow-sm sm:ring-1 sm:ring-gray-100">
        <div className="mb-10 sm:mb-7 sm:text-center">
          <h1 className="text-[46px] font-black leading-none tracking-[-3px] text-gray-900 sm:text-[28px] sm:tracking-tight">
            Deazl<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400 sm:mt-1.5">
            <Trans>Smart meal planning & grocery management</Trans>
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
