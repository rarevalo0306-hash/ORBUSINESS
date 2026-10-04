"use client";

import { useActionState, useState } from "react";
import { Button, Field } from "@/components/ui";
import { signIn, signUp, type AuthState } from "./actions";

export function LoginForm({ startInSignUp }: { startInSignUp: boolean }) {
  const [isSignUp, setIsSignUp] = useState(startInSignUp);
  const [state, action, pending] = useActionState<AuthState, FormData>(isSignUp ? signUp : signIn, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Correo" id="email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Contraseña"
        id="password"
        name="password"
        type="password"
        autoComplete={isSignUp ? "new-password" : "current-password"}
        minLength={isSignUp ? 8 : undefined}
        required
      />
      {state.error && (
        <p role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      )}
      {state.notice && (
        <p role="status" className="rounded-xl border border-lime/40 bg-lime/10 px-4 py-3 text-sm">
          {state.notice}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Un momento…" : isSignUp ? "Crear mi cuenta" : "Entrar"}
      </Button>
      <button
        type="button"
        onClick={() => setIsSignUp(!isSignUp)}
        className="min-h-11 text-sm text-muted underline underline-offset-4 hover:text-bone"
      >
        {isSignUp ? "Ya tengo cuenta: entrar" : "No tengo cuenta: crear una"}
      </button>
    </form>
  );
}
