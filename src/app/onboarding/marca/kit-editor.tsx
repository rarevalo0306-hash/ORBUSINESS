"use client";

import { useState, useTransition } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui";
import { FONT_PAIRS, SHAPES, fontsById, gradientCss, onColor, paletteById, type BrandKit, type Palette } from "@/lib/brand";
import { customizeKit } from "./actions";

// El dueño ajusta su marca y la ve cambiar al momento. Solo piezas curadas (siempre se ve bien).
export function KitEditor({
  kit,
  name,
  palettes,
  icons,
}: {
  kit: BrandKit;
  name: string;
  palettes: Palette[];
  icons: string[];
}) {
  const [draft, setDraft] = useState(kit);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = JSON.stringify(draft) !== JSON.stringify(kit);
  const p = paletteById(draft.palette);
  const f = fontsById(draft.fonts);
  const set = (changes: Partial<BrandKit>) => {
    setSaved(false);
    setDraft((d) => ({ ...d, ...changes }));
  };

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        await customizeKit(draft);
        setSaved(true);
      } catch {
        setError("No se pudo guardar. Intenta de nuevo.");
      }
    });
  }

  const option = (active: boolean) =>
    `flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
      active ? "border-lime bg-panel-2" : "border-line hover:bg-panel-2"
    }`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* Vista previa */}
      <div className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
        <div className="flex min-h-36 items-center justify-center rounded-2xl p-6" style={{ background: p.light }}>
          <BrandLogo kit={draft} name={name} size={56} className="max-w-full flex-wrap justify-center" />
        </div>
        <div
          className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center"
          style={{ background: gradientCss(p), color: onColor(p.primary, p.dark) }}
        >
          <BrandLogo kit={draft} name={name} layout="isotipo" theme="blanco" size={64} />
          <span style={{ fontFamily: `"${f.heading.family}"`, fontWeight: f.heading.weight }} className="text-xl">
            {draft.slogan}
          </span>
        </div>
        <div className="flex gap-2" aria-label="Colores de la marca">
          {[p.primary, p.secondary, p.accent, p.dark, p.light].map((c) => (
            <span key={c} className="h-10 flex-1 rounded-lg border border-line" style={{ background: c }} title={c} />
          ))}
        </div>
      </div>

      {/* Ajustes */}
      <div className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Colores</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {palettes.map((pal) => (
              <button
                key={pal.id}
                type="button"
                aria-pressed={draft.palette === pal.id}
                onClick={() => set({ palette: pal.id })}
                className={option(draft.palette === pal.id)}
              >
                <span className="flex shrink-0 -space-x-1.5" aria-hidden>
                  {[pal.primary, pal.secondary, pal.accent].map((c) => (
                    <span key={c} className="size-5 rounded-full border border-ink" style={{ background: c }} />
                  ))}
                </span>
                {pal.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Tipo de letra</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FONT_PAIRS.map((pair) => (
              <button
                key={pair.id}
                type="button"
                aria-pressed={draft.fonts === pair.id}
                onClick={() => set({ fonts: pair.id })}
                className={option(draft.fonts === pair.id)}
              >
                <span
                  className="text-lg"
                  style={{ fontFamily: `"${pair.heading.family}"`, fontWeight: pair.heading.weight }}
                >
                  {pair.name}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Símbolo</legend>
          <div className="flex flex-wrap gap-2">
            {icons.map((icon) => {
              const active = !draft.monogram && draft.icon === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Símbolo ${icon}`}
                  onClick={() => set({ icon, monogram: false })}
                  className={`flex size-14 items-center justify-center rounded-xl border bg-bone/95 ${active ? "border-lime ring-2 ring-lime" : "border-line"}`}
                >
                  <BrandLogo kit={{ ...draft, icon, monogram: false }} name={name} layout="isotipo" size={40} />
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={draft.monogram}
              onClick={() => set({ monogram: true })}
              className={`flex h-14 items-center gap-2 rounded-xl border bg-bone/95 px-2 text-sm font-semibold text-ink ${draft.monogram ? "border-lime ring-2 ring-lime" : "border-line"}`}
            >
              <BrandLogo kit={{ ...draft, monogram: true }} name={name} layout="isotipo" size={40} />
              Iniciales
            </button>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Forma</legend>
          <div className="flex flex-wrap gap-2">
            {SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={draft.shape === s.id}
                onClick={() => set({ shape: s.id })}
                className={option(draft.shape === s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="slogan" className="font-semibold">
            Eslogan
          </label>
          <input
            id="slogan"
            value={draft.slogan}
            maxLength={90}
            onChange={(e) => set({ slogan: e.target.value })}
            className="min-h-12 rounded-xl border border-line bg-ink px-4"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={save} disabled={!changed || pending || !draft.slogan.trim()}>
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
          {changed && !pending && (
            <button type="button" onClick={() => setDraft(kit)} className="min-h-11 text-sm text-muted underline underline-offset-4">
              Deshacer
            </button>
          )}
          <span role="status" className="text-sm text-lime">
            {saved && !changed ? "✓ Guardado" : ""}
          </span>
          {error && (
            <span role="alert" className="text-sm text-red-300">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
