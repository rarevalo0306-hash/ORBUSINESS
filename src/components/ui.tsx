import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Piezas de interfaz compartidas, con los colores de la marca (negro y lima) y estilo limpio tipo Apple:
// tarjetas muy redondeadas, títulos grandes, mucho espacio y estados claros al tocar.

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: "primary" | "ghost" }) {
  const base =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
  const look =
    variant === "primary"
      ? "bg-lime text-lime-ink hover:brightness-110"
      : "border border-line text-bone hover:bg-panel-2";
  return <button className={`${base} ${look} ${className}`} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: "primary" | "ghost" }) {
  const base = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold transition active:scale-[0.98]";
  const look =
    variant === "primary"
      ? "bg-lime text-lime-ink hover:brightness-110"
      : "border border-line text-bone hover:bg-panel-2";
  return <Link className={`${base} ${look} ${className}`} {...props} />;
}

export function Field({ label, id, ...props }: ComponentProps<"input"> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-muted">
        {label}
      </label>
      <input
        id={id}
        className="min-h-12 rounded-2xl border border-line bg-panel px-4 text-bone transition placeholder:text-muted/70 focus:border-lime/60"
        {...props}
      />
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[28px] border border-white/[0.06] bg-panel p-6 sm:p-8 ${className}`}>{children}</div>;
}

export function PageTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">{title}</h1>
      {lead && <p className="max-w-2xl text-lg text-muted sm:text-xl">{lead}</p>}
    </div>
  );
}
