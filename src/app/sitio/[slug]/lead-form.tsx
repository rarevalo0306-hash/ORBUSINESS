"use client";

import { useActionState } from "react";
import { submitLead, type LeadState } from "./actions";

const input = "min-h-12 rounded-xl border border-[#c9d2bd] bg-white px-4 text-[#1f2a1c] placeholder:text-[#7d8a76]";

export function LeadForm({ slug, cta }: { slug: string; cta: string }) {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitLead.bind(null, slug), {});

  if (state.ok) {
    return (
      <p role="status" className="rounded-2xl bg-[#dfe6d6] p-6 text-lg">
        ¡Gracias! Recibimos tus datos y te contactamos muy pronto.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Tu nombre
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
        ¿Qué necesitas?
        <textarea name="message" rows={3} maxLength={2000} className={`${input} py-3`} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-[#a33a2a]">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-full bg-[#1f2a1c] px-6 font-semibold text-[#f4f1ea] disabled:opacity-60"
      >
        {pending ? "Enviando…" : cta}
      </button>
    </form>
  );
}
