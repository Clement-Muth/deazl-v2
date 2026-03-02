import { AuthForm } from "@/applications/user/ui/components/auth/authForm";
import { signUp } from "@/applications/user/application/useCases/signUp";

export default function RegisterPage() {
  return (
    <>
      <h2 className="mb-6 text-lg font-semibold text-gray-900">Créer un compte</h2>
      <AuthForm mode="register" action={signUp} />
    </>
  );
}
