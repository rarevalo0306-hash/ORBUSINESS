"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STEPS = [
  { key: "interview", href: "/onboarding/entrevista", label: "Reconocimiento" },
  { key: "brand", href: "/onboarding/marca", label: "Logo, fotos y web" },
  { key: "website", href: "/onboarding/web", label: "Página web" },
  { key: "crm", href: "/onboarding/crm", label: "CRM a tu medida" },
  { key: "activate", href: "/onboarding/activar", label: "Activar a Nuna" },
];

export function StepNav({ reached }: { reached: string }) {
  const pathname = usePathname();
  const reachedIndex = reached === "done" ? STEPS.length : STEPS.findIndex((s) => s.key === reached);

  return (
    <nav aria-label="Pasos del alta">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const current = pathname === s.href;
          const open = i <= reachedIndex;
          const label = `${i + 1}. ${s.label}${i < reachedIndex ? " ✓" : ""}`;
          const style = current
            ? "border-lime bg-lime text-lime-ink"
            : open
              ? "border-line text-bone hover:bg-panel"
              : "border-line/50 text-muted/60";
          return (
            <li key={s.key}>
              {open ? (
                <Link
                  href={s.href}
                  aria-current={current ? "step" : undefined}
                  className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold ${style}`}
                >
                  {label}
                </Link>
              ) : (
                <span className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm ${style}`}>{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
