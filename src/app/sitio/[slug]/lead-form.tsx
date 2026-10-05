"use client";

import { useActionState } from "react";
import type { SiteCopy } from "@/lib/site";
import { submitLead, type LeadState } from "./actions";

const input = "min-h-12 rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] px-4 text-[var(--ink)] placeholder:text-[var(--muted)]";

export function LeadForm({ slug, cta, copy }: { slug: string; cta: string; copy?: SiteCopy }) {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead.bind(null, slug), {});

  if (state.ok) {
    return (
      <p role="status" className="rounded-[var(--rl)] bg-[var(--surface)] p-6 text-lg">
        {copy?.thanks ?? "¡Gracias! Recibimos tus datos y te contactamos muy pronto."}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {copy?.nameLabel ?? "Tu nombre"}
        <input name="name" required maxLength={120} autoComplete="name" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Teléfono
        <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Correo
        <input name="email" type="email" maxLength={200} autoComplete="email" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {copy?.needLabel ?? "¿Qué necesitas?"}
        <textarea name="message" rows={3} maxLength={2000} className={`${input} py-3`} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-[#d14343]">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-[var(--rb)] bg-[var(--btn)] px-6 font-semibold text-[var(--on-btn)] disabled:opacity-60"
      >
        {pending ? "Enviando…" : cta}
      </button>
    </form>
  );
}
