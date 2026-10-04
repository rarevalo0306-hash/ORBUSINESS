import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Piezas de interfaz compartidas, con los colores de la marca.

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: "primary" | "ghost" }) {
  const base = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold transition disabled:opacity-50";
  const look =
    variant === "primary"
      ? "bg-lime text-lime-ink hover:brightness-110"
      : "border border-line text-bone hover:bg-panel";
  return <button className={`${base} ${look} ${className}`} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: "primary" | "ghost" }) {
  const base = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold transition";
  const look =
    variant === "primary"
      ? "bg-lime text-lime-ink hover:brightness-110"
      : "border border-line text-bone hover:bg-panel";
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
        className="min-h-12 rounded-xl border border-line bg-panel px-4 text-bone placeholder:text-muted/70"
        {...props}
      />
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-panel p-5 ${className}`}>{children}</div>;
}

export function PageTitle({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h1>
      {lead && <p className="max-w-2xl text-muted">{lead}</p>}
    </div>
  );
}
