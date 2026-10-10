"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STEPS = [
  { key: "interview", href: "/onboarding/entrevista", label: "Reconocimiento" },
  { key: "brand", href: "/onboarding/marca", label: "Marca, fotos y web" },
  { key: "website", href: "/onboarding/web", label: "Página web" },
  { key: "crm", href: "/onboarding/crm", label: "CRM a tu medida" },
  { key: "activate", href: "/onboarding/activar", label: "Activar a Nuna" },
];

// Avance del alta: barra de progreso y los pasos en una fila (en celular se desliza de lado).
export function StepNav({ reached }: { reached: string }) {
  const pathname = usePathname();
  const reachedIndex = reached === "done" ? STEPS.length : STEPS.findIndex((s) => s.key === reached);
  const currentIndex = Math.max(0, STEPS.findIndex((s) => pathname.startsWith(s.href)));
  const done = Math.min(reachedIndex, STEPS.length);

  return (
    <nav aria-label="Pasos del alta" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-semibold">
          Paso {currentIndex + 1} de {STEPS.length} · {STEPS[currentIndex].label}
        </span>
        <span className="text-muted">{Math.round((done / STEPS.length) * 100)}% listo</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-2" aria-hidden>
        <div className="h-full rounded-full bg-lime transition-all duration-500" style={{ width: `${(done / STEPS.length) * 100}%` }} />
      </div>
      <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {STEPS.map((s, i) => {
          const current = i === currentIndex;
          const open = i <= reachedIndex;
          const finished = i < reachedIndex;
          const style = current
            ? "bg-lime text-lime-ink"
            : open
              ? "bg-panel text-bone hover:bg-panel-2"
              : "text-muted/50";
          const content = (
            <>
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${current ? "bg-lime-ink/15" : finished ? "bg-lime text-lime-ink" : "bg-panel-2"}`}
              >
                {finished && !current ? "✓" : i + 1}
              </span>
              {s.label}
            </>
          );
          return (
            <li key={s.key} className="shrink-0">
              {open ? (
                <Link
                  href={s.href}
                  aria-current={current ? "step" : undefined}
                  className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full pl-2 pr-4 text-sm font-semibold transition active:scale-[0.98] ${style}`}
                >
                  {content}
                </Link>
              ) : (
                <span className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full pl-2 pr-4 text-sm ${style}`}>{content}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
