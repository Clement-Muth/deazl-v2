import { AuthForm } from "@/applications/user/ui/components/auth/authForm";
import { signIn } from "@/applications/user/application/useCases/signIn";

export default function LoginPage() {
  return (
    <>
      <h2 className="mb-6 text-lg font-semibold text-gray-900">Connexion</h2>
      <AuthForm mode="login" action={signIn} />
    </>
  );
}
