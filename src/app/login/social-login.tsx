"use client";

import { useActionState, useState } from "react";
import { Button, Field } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { sendWhatsappCode, signInWithProvider, verifyWhatsappCode, type WhatsappState } from "./actions";

export type Providers = { google: boolean; facebook: boolean; whatsapp: boolean; phoneChannel: "sms" | "whatsapp" };

const button =
  "flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-panel px-6 font-semibold transition hover:bg-panel-2 active:scale-[0.98]";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2a11 11 0 0 0 0 9.8L5.7 14Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7.1L5.7 10c.9-2.7 3.4-4.6 6.3-4.6Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path fill="#fff" d="M15.1 15.5l.5-3.2h-3v-2.1c0-.9.4-1.7 1.8-1.7h1.4V5.8s-1.3-.2-2.5-.2c-2.6 0-4.2 1.5-4.2 4.3v2.4H6.3v3.2h2.8V24h3.5v-8.5h2.5Z" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path fill="#fff" d="M12 5.5a6.5 6.5 0 0 0-5.6 9.8l-.9 3.2 3.3-.9A6.5 6.5 0 1 0 12 5.5Zm3.8 9.2c-.2.5-.9.9-1.4 1-.4 0-.8.2-2.7-.6-2.3-1-3.7-3.3-3.8-3.4-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.9c.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .5.4l.7 1.6c.1.1.1.3 0 .4l-.3.4-.3.3c-.1.1-.2.3-.1.5.2.3.6 1 1.3 1.6.9.8 1.6 1 1.9 1.1.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.5-.1l1.5.7c.2.1.4.2.4.3.1.1.1.6-.1 1.2Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden>
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  );
}

function WhatsappLogin({ onBack, viaWhatsapp }: { onBack: () => void; viaWhatsapp: boolean }) {
  const [sent, send, sending] = useActionState<WhatsappState, FormData>(sendWhatsappCode, {});
  const [checked, verify, verifying] = useActionState<WhatsappState, FormData>(verifyWhatsappCode, {});
  const phone = checked.phone || sent.phone;
  const message = checked.error ?? (phone ? sent.notice : sent.error);
  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-line bg-panel p-5">
      {!phone ? (
        <form action={send} className="flex flex-col gap-4">
          <Field label={viaWhatsapp ? "Tu número de WhatsApp" : "Tu número de celular"} id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+505 8888 7777" required />
          <Button type="submit" disabled={sending}>
            {sending ? "Mandando…" : "Mandarme el código"}
          </Button>
        </form>
      ) : (
        <form action={verify} className="flex flex-col gap-4">
          <input type="hidden" name="phone" value={phone} />
          <Field label={`Código que llegó a ${phone}`} id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} required />
          <Button type="submit" disabled={verifying}>
            {verifying ? "Revisando…" : "Entrar"}
          </Button>
        </form>
      )}
      {message && (
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      )}
      <button type="button" onClick={onBack} className="min-h-11 text-sm text-muted underline underline-offset-4 hover:text-bone">
        Volver
      </button>
    </div>
  );
}

// Botones para entrar con Google, Facebook o WhatsApp (solo los que están activados).
export function SocialLogin({ providers }: { providers: Providers }) {
  const [whatsapp, setWhatsapp] = useState(false);
  if (!providers.google && !providers.facebook && !providers.whatsapp) return null;
  const viaWhatsapp = providers.phoneChannel === "whatsapp";
  if (whatsapp) return <WhatsappLogin onBack={() => setWhatsapp(false)} viaWhatsapp={viaWhatsapp} />;
  return (
    <div className="flex flex-col gap-3">
      {providers.google && (
        <form action={signInWithProvider.bind(null, "google")}>
          <SubmitButton variant="ghost" pendingText="Abriendo Google…" className={button}>
            <GoogleIcon /> Continuar con Google
          </SubmitButton>
        </form>
      )}
      {providers.facebook && (
        <form action={signInWithProvider.bind(null, "facebook")}>
          <SubmitButton variant="ghost" pendingText="Abriendo Facebook…" className={button}>
            <FacebookIcon /> Continuar con Facebook
          </SubmitButton>
        </form>
      )}
      {providers.whatsapp && (
        <button type="button" onClick={() => setWhatsapp(true)} className={button}>
          {viaWhatsapp ? <WhatsappIcon /> : <PhoneIcon />} {viaWhatsapp ? "Continuar con WhatsApp" : "Continuar con tu celular"}
        </button>
      )}
      <div className="flex items-center gap-3 py-1 text-sm text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" /> o con tu correo <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
