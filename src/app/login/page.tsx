import Link from "next/link";
import { Wordmark } from "@/components/fish";
import { LoginForm } from "./login-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const query = await props.searchParams;
  const startInSignUp = query.modo === "registro";

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
      <LoginForm startInSignUp={startInSignUp} />
    </main>
  );
}
