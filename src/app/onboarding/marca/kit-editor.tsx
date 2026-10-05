"use client";

import { useState, useTransition } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Fit } from "@/components/fit";
import { Button } from "@/components/ui";
import {
  FONT_PAIRS,
  LAYOUTS,
  NAME_STYLES,
  PATTERNS,
  SHAPES,
  fontsById,
  gradientCss,
  kitPalette,
  onColor,
  patternCss,
  type BrandKit,
  type Colors,
  type Palette,
} from "@/lib/brand";
import { customizeKit } from "./actions";

// El dueño ajusta su marca y la ve cambiar al momento. Solo piezas curadas (siempre se ve bien).
export function KitEditor({
  kit,
  name,
  palettes,
  customColors,
  icons,
}: {
  kit: BrandKit;
  name: string;
  palettes: Palette[];
  customColors: { label: string; colors: Colors }[]; // paletas que Nuna inventó en las propuestas
  icons: string[];
}) {
  const [draft, setDraft] = useState(kit);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = JSON.stringify(draft) !== JSON.stringify(kit);
  const p = kitPalette(draft);
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
  const sameColors = (c: Colors) => draft.colors && JSON.stringify(c) === JSON.stringify(draft.colors);
  const dots = (c: Pick<Colors, "primary" | "secondary" | "accent">) => (
    <span className="flex shrink-0 -space-x-1.5" aria-hidden>
      {[c.primary, c.secondary, c.accent].map((x, i) => (
        <span key={i} className="size-5 rounded-full border border-ink" style={{ background: x }} />
      ))}
    </span>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* Vista previa */}
      <div className="flex flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
        <div
          className="flex min-h-44 items-center justify-center overflow-hidden rounded-2xl p-6"
          style={{ background: p.light, backgroundImage: patternCss(draft, p.primary, 0.06) }}
        >
          <Fit>
            <BrandLogo kit={draft} name={name} size={64} />
          </Fit>
        </div>
        <div
          className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl p-6 text-center"
          style={{ backgroundImage: `${patternCss(draft, "#FFFFFF", 0.1)}, ${gradientCss(p)}`, color: onColor(p.primary, p.dark) }}
        >
          <Fit>
            <BrandLogo kit={draft} name={name} size={draft.layout === "emblema" ? 48 : 56} theme="blanco" />
          </Fit>
          <span style={{ fontFamily: `"${f.heading.family}"`, fontWeight: f.heading.weight }} className="text-xl">
            {draft.slogan}
          </span>
        </div>
        <div className="flex gap-2" aria-label="Colores de la marca">
          {[p.primary, p.secondary, p.accent, p.dark, p.light].map((c, i) => (
            <span key={i} className="h-10 flex-1 rounded-lg border border-line" style={{ background: c }} title={c} />
          ))}
        </div>
      </div>

      {/* Ajustes */}
      <div className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Estilo de logo</legend>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUTS.map((l) => (
              <button key={l.id} type="button" aria-pressed={draft.layout === l.id} onClick={() => set({ layout: l.id })} className={option(draft.layout === l.id)}>
                <span className="flex flex-col">
                  <span className="font-semibold">{l.label}</span>
                  <span className="text-xs text-muted">{l.note}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Colores</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {customColors.map((c) => (
              <button key={c.label} type="button" aria-pressed={Boolean(sameColors(c.colors))} onClick={() => set({ colors: c.colors, palette: "custom" })} className={option(Boolean(sameColors(c.colors)))}>
                {dots(c.colors)}
                {c.label}
              </button>
            ))}
            {palettes.map((pal) => {
              const active = !draft.colors && draft.palette === pal.id;
              return (
                <button key={pal.id} type="button" aria-pressed={active} onClick={() => set({ palette: pal.id, colors: null })} className={option(active)}>
                  {dots(pal)}
                  {pal.name}
                </button>
              );
            })}
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
                onClick={() => set({ fonts: pair.id, ...(pair.script && draft.nameStyle === "mayusculas" ? { nameStyle: "normal" as const } : {}) })}
                className={option(draft.fonts === pair.id)}
              >
                <span className="text-lg" style={{ fontFamily: `"${pair.heading.family}"`, fontWeight: pair.heading.weight }}>
                  {pair.name}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Cómo se escribe el nombre</legend>
          <div className="flex flex-wrap gap-2">
            {NAME_STYLES.filter((s) => !(s.id === "mayusculas" && f.script)).map((s) => (
              <button key={s.id} type="button" aria-pressed={draft.nameStyle === s.id} onClick={() => set({ nameStyle: s.id })} className={option(draft.nameStyle === s.id)}>
                {s.label}
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
                  <BrandLogo kit={{ ...draft, icon, monogram: false }} name={name} variant="isotipo" size={40} />
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={draft.monogram}
              onClick={() => set({ monogram: true })}
              className={`flex h-14 items-center gap-2 rounded-xl border bg-bone/95 px-2 text-sm font-semibold text-ink ${draft.monogram ? "border-lime ring-2 ring-lime" : "border-line"}`}
            >
              <BrandLogo kit={{ ...draft, monogram: true }} name={name} variant="isotipo" size={40} />
              Iniciales
            </button>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Forma del símbolo</legend>
          <div className="flex flex-wrap gap-2">
            {SHAPES.map((s) => (
              <button key={s.id} type="button" aria-pressed={draft.shape === s.id} onClick={() => set({ shape: s.id })} className={option(draft.shape === s.id)}>
                <BrandLogo kit={{ ...draft, shape: s.id }} name={name} variant="isotipo" size={24} />
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Patrón</legend>
          <div className="flex flex-wrap gap-2">
            {PATTERNS.map((pt) => (
              <button key={pt.id} type="button" aria-pressed={draft.pattern === pt.id} onClick={() => set({ pattern: pt.id })} className={option(draft.pattern === pt.id)}>
                <span
                  aria-hidden
                  className="size-6 rounded-md border border-line"
                  style={{ background: p.light, backgroundImage: patternCss({ ...draft, pattern: pt.id }, p.primary, 0.7, 24) }}
                />
                {pt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="slogan" className="font-semibold">
              Eslogan
            </label>
            <input id="slogan" value={draft.slogan} maxLength={90} onChange={(e) => set({ slogan: e.target.value })} className="min-h-12 rounded-xl border border-line bg-ink px-4" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="caption" className="font-semibold">
              Texto pequeño del logo
            </label>
            <input id="caption" value={draft.caption} maxLength={40} onChange={(e) => set({ caption: e.target.value })} placeholder="Ferretería · Managua" className="min-h-12 rounded-xl border border-line bg-ink px-4 placeholder:text-muted/70" />
          </div>
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
