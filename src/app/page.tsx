import Link from "next/link";
import { Fish, Wordmark } from "@/components/fish";
import { ButtonLink } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 py-8 sm:px-8">
      <header className="flex items-center justify-between">
        <Wordmark />
        <ButtonLink href="/login" variant="ghost">
          Entrar
        </ButtonLink>
      </header>

      <section className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-6">
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Tu negocio en línea, con una asistente que trabaja contigo
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Platícale tu negocio a Nuna. Ella diseña tu página web, te arma un CRM a tu medida y se queda atendiendo a tus
            clientes. Tú no conectas ni configuras nada.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/login?modo=registro">Empezar gratis</ButtonLink>
            <ButtonLink href="/login" variant="ghost">
              Ya tengo cuenta
            </ButtonLink>
          </div>
        </div>
        <Fish size={220} strokeWidth={0.9} className="hidden text-lime sm:block" />
      </section>

      <ol className="grid gap-4 sm:grid-cols-3">
        {[
          ["1", "Platica con Nuna", "Te hace preguntas sencillas para entender tu negocio y cómo trabajas."],
          ["2", "Web y CRM listos", "Publica tu página y arma un CRM con las etapas de tu trabajo."],
          ["3", "Nuna atiende", "Contesta, agenda, cotiza y da seguimiento por ti."],
        ].map(([n, title, text]) => (
          <li key={n} className="flex flex-col gap-2 rounded-2xl border border-line bg-panel p-5">
            <span className="font-display text-2xl font-bold text-lime">{n}</span>
            <span className="text-lg font-semibold">{title}</span>
            <span className="text-muted">{text}</span>
          </li>
        ))}
      </ol>
      <footer className="flex gap-6 border-t border-line pt-6 text-sm text-muted">
        <Link href="/privacidad" className="underline underline-offset-4 hover:text-bone">Privacidad</Link>
        <Link href="/terminos" className="underline underline-offset-4 hover:text-bone">Términos</Link>
      </footer>
    </main>
  );
}
