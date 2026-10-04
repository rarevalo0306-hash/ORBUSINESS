"use client";

import { useTransition } from "react";
import { restartInterview } from "./actions";

export function RestartButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("¿Empezar la entrevista de nuevo? Nuna olvidará lo que le contaste.")) {
          startTransition(() => restartInterview());
        }
      }}
      className="min-h-11 text-sm text-muted underline underline-offset-4 hover:text-bone disabled:opacity-50"
    >
      {pending ? "Reiniciando…" : "Empezar de nuevo"}
    </button>
  );
}
