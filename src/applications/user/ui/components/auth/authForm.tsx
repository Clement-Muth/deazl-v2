"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { AuthInput } from "./authInput";
import { signInWithGoogle } from "@/applications/user/application/useCases/signInWithGoogle";

type AuthState = { error: string } | undefined;

interface AuthFormProps {
  mode: "login" | "register";
  action: (prevState: AuthState, formData: FormData) => Promise<AuthState>;
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, undefined);
  const [isGooglePending, startTransition] = useTransition();
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {!isLogin && (
        <AuthInput
          id="displayName"
          label="Prénom"
          name="displayName"
          type="text"
          required
          autoComplete="given-name"
          placeholder="Marie"
        />
      )}

      <AuthInput
        id="email"
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="marie@exemple.fr"
      />

      <AuthInput
        id="password"
        label="Mot de passe"
        name="password"
        type="password"
        required
        autoComplete={isLogin ? "current-password" : "new-password"}
        placeholder="••••••••"
      />

      {state?.error && (
        <p className="rounded-md bg-destructive-light px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Chargement..." : isLogin ? "Se connecter" : "Créer mon compte"}
      </button>

      <div className="relative my-1 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        type="button"
        disabled={isGooglePending}
        onClick={() => startTransition(() => signInWithGoogle())}
        className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {isGooglePending ? "Chargement..." : "Continuer avec Google"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? (
          <>
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              S&apos;inscrire
            </Link>
          </>
        ) : (
          <>
            Déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
