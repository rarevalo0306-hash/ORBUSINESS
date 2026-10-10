import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/fish";

// Páginas legales (privacidad y términos): texto simple y fácil de leer.
export const LEGAL_UPDATED = "10 de octubre de 2026";
export const LEGAL_CONTACT = "rarevalo0306@gmail.com";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-8">
      <Link href="/" aria-label="Inicio">
        <Wordmark />
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        <p className="text-muted">Última actualización: {LEGAL_UPDATED}</p>
      </div>
      <div className="flex flex-col gap-6 leading-relaxed text-bone/90 [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-bone [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        {children}
      </div>
      <nav className="flex gap-6 border-t border-line pt-6 text-sm text-muted">
        <Link href="/privacidad" className="underline underline-offset-4 hover:text-bone">Privacidad</Link>
        <Link href="/terminos" className="underline underline-offset-4 hover:text-bone">Términos</Link>
        <Link href="/eliminar-datos" className="underline underline-offset-4 hover:text-bone">Borrar mis datos</Link>
        <Link href="/" className="underline underline-offset-4 hover:text-bone">Inicio</Link>
      </nav>
    </main>
  );
}
