import { Trans } from "@lingui/react/macro";
import { initLinguiFromCookie } from "@/lib/i18n/server";
import { AuthForm } from "@/applications/user/ui/components/auth/authForm";
import { signIn } from "@/applications/user/application/useCases/signIn";

export default async function LoginPage() {
  await initLinguiFromCookie();
  return (
    <>
      <h2 className="mb-6 text-2xl font-bold text-gray-900 sm:text-lg sm:font-semibold">
        <Trans>Sign in</Trans>
      </h2>
      <AuthForm mode="login" action={signIn} />
    </>
  );
}
