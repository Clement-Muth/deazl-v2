import { initLinguiFromCookie } from "@/lib/i18n/server";
import { Trans } from "@lingui/react/macro";
import Link from "next/link";

export default async function EmailConfirmedPage() {
  await initLinguiFromCookie();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        <Trans>Email mis à jour</Trans>
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        <Trans>Ton adresse email a bien été confirmée.</Trans>
      </p>

      <Link
        href="deazl://"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white"
      >
        <Trans>Retourner dans l'application</Trans>
      </Link>
    </div>
  );
}
