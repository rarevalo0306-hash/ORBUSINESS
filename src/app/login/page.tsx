import Link from "next/link";
import { Wordmark } from "@/components/fish";
import { LoginForm } from "./login-form";
import { SocialLogin, type Providers } from "./social-login";

// Qué formas de entrar están activadas en Supabase (se revisa cada 5 minutos).
async function providers(): Promise<Providers> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "" },
      next: { revalidate: 300 },
    });
    const { external = {} } = (await res.json()) as { external?: Record<string, boolean> };
    return { google: Boolean(external.google), facebook: Boolean(external.facebook), whatsapp: Boolean(external.phone) };
  } catch {
    return { google: false, facebook: false, whatsapp: false };
  }
}

export default async function LoginPage(props: PageProps<"/login">) {
  const query = await props.searchParams;
  const startInSignUp = query.modo === "registro";
  const enabled = await providers();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-10">
      <Link href="/" aria-label="Inicio">
        <Wordmark />
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {startInSignUp ? "Crea tu cuenta" : "Entra a tu negocio"}
        </h1>
        <p className="text-muted">Con tu cuenta, Nuna te guía para armar tu página web y tu CRM.</p>
      </div>
      {query.error === "proveedor" && (
        <p role="alert" className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          No pudimos entrar con esa cuenta. Intenta de nuevo o entra con tu correo.
        </p>
      )}
      <SocialLogin providers={enabled} />
      <LoginForm startInSignUp={startInSignUp} />
    </main>
  );
}
