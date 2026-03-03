import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { AuthForm } from "@/applications/user/ui/components/auth/authForm";
import { signUp } from "@/applications/user/application/useCases/signUp";

export default async function RegisterPage() {
  await initLinguiFromCookie();
  return (
    <>
      <h2 className="mb-6 text-2xl font-bold text-gray-900 sm:text-lg sm:font-semibold">
        <Trans>Create an account</Trans>
      </h2>
      <AuthForm mode="register" action={signUp} />
    </>
  );
}
