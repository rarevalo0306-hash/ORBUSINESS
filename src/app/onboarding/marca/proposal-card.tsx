import { BrandLogo } from "@/components/brand-logo";
import { Fit } from "@/components/fit";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui";
import { LAYOUTS, backdropCss, fontsById, kitPalette, logoType, type BrandKit } from "@/lib/brand";
import { chooseKit } from "./actions";

// Una propuesta de marca presentada como un tablero pequeño (logo, símbolo, eslogan y colores).
export function Proposal({ kit, name, index, selected }: { kit: BrandKit; name: string; index: number; selected: boolean }) {
  const p = kitPalette(kit);
  const f = fontsById(kit.fonts);
  return (
    <article className={`flex flex-col gap-4 rounded-3xl border bg-panel p-3 ${selected ? "border-lime" : "border-line"}`}>
      {/* Mini tablero de marca */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-3 flex min-h-36 items-center justify-center overflow-hidden rounded-2xl p-5" style={{ background: backdropCss(kit, "claro") }}>
          <Fit>
            <BrandLogo kit={kit} name={name} size={44} />
          </Fit>
        </div>
        <div className="flex aspect-square items-center justify-center rounded-2xl" style={{ background: backdropCss(kit, "oscuro") }}>
          <BrandLogo kit={kit} name={name} variant="isotipo" theme="blanco" size={40} />
        </div>
        <div className="col-span-2 flex flex-col justify-end gap-1 overflow-hidden rounded-2xl p-3 text-white" style={{ background: backdropCss(kit, "oscuro") }}>
          <span className="text-lg leading-tight" style={{ fontFamily: `"${f.heading.family}"`, fontWeight: f.heading.weight, letterSpacing: "-0.02em" }}>
            {kit.slogan}
          </span>
        </div>
        <div className="col-span-3 flex h-10 gap-1 overflow-hidden rounded-2xl" aria-label="Colores">
          {[p.primary, p.secondary, p.accent, p.dark, p.light].map((c, i) => (
            <span key={i} className="flex-1" style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1 px-2">
        <span className="self-start rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold text-lime" title={logoType(kit).note}>
          {logoType(kit).name}
        </span>
        <h3 className="font-display text-xl font-bold">{kit.name}</h3>
        <p className="text-sm text-muted">{kit.concept}</p>
        <p className="mt-1 text-xs text-muted">
          {LAYOUTS.find((l) => l.id === kit.layout)?.label} · letra {f.name.toLowerCase()} · {kit.personality.join(" · ")}
        </p>
      </div>
      <form action={chooseKit.bind(null, index)} className="mt-auto px-2 pb-2">
        {selected ? (
          <Button type="button" variant="ghost" disabled className="w-full">
            ✓ Elegida
          </Button>
        ) : (
          <SubmitButton pendingText="Nuna está escribiendo tu marca…" className="w-full">
            Elegir esta
          </SubmitButton>
        )}
      </form>
    </article>
  );
}

