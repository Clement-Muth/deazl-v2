import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";

export default async function RecipesPage() {
  await initLinguiFromCookie();
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900"><Trans>Recipes</Trans></h1>
      <p className="mt-1 text-sm text-gray-500"><Trans>Your recipes</Trans></p>
    </div>
  );
}
