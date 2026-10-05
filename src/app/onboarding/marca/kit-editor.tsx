"use client";

import { useState, useTransition, type ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Fit } from "@/components/fit";
import { Button } from "@/components/ui";
import {
  FONT_PAIRS,
  LAYOUTS,
  MARKS,
  NAME_STYLES,
  PATTERNS,
  backdropCss,
  fontsById,
  kitPalette,
  type BrandKit,
  type Colors,
  type Palette,
} from "@/lib/brand";
import { customizeKit } from "./actions";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

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
  const iconMark = MARKS.find((m) => m.id === draft.mark)?.kind === "icono";
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
    `flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${active ? "border-lime bg-panel-2" : "border-line hover:bg-panel-2"}`;
  const tileBtn = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-xs transition ${active ? "border-lime ring-2 ring-lime" : "border-line hover:border-muted"}`;
  const sameColors = (c: Colors) => Boolean(draft.colors) && JSON.stringify(c) === JSON.stringify(draft.colors);
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
        <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-3xl p-8" style={{ background: backdropCss(draft, "claro") }}>
          <Fit>
            <BrandLogo kit={draft} name={name} size={64} />
          </Fit>
        </div>
        <div className="flex min-h-48 flex-col justify-between gap-6 overflow-hidden rounded-3xl p-7 text-white" style={{ background: backdropCss(draft, "oscuro") }}>
          <Fit align="start">
            <BrandLogo kit={draft} name={name} size={40} theme="blanco" compact />
          </Fit>
          <span style={{ fontFamily: `"${f.heading.family}"`, fontWeight: f.heading.weight, letterSpacing: "-0.02em" }} className="text-3xl leading-none">
            {draft.slogan}
          </span>
        </div>
        <div className="flex gap-2" aria-label="Colores de la marca">
          {[p.primary, p.secondary, p.accent, p.dark, p.light].map((c, i) => (
            <span key={i} className="h-12 flex-1 rounded-xl border border-line" style={{ background: c }} title={c} />
          ))}
        </div>
      </div>

      {/* Ajustes */}
      <div className="flex flex-col gap-6">
        <Group title="Estilo de logo">
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
        </Group>

        <Group title="Símbolo">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {MARKS.map((m) => (
              <button key={m.id} type="button" aria-pressed={draft.mark === m.id} aria-label={m.label} title={m.label} onClick={() => set({ mark: m.id })} className={`${tileBtn(draft.mark === m.id)} bg-white`}>
                <BrandLogo kit={{ ...draft, mark: m.id }} name={name} variant="isotipo" size={44} />
              </button>
            ))}
          </div>
        </Group>

        {iconMark && (
          <Group title="Ícono">
            <div className="flex flex-wrap gap-2">
              {icons.map((icon) => (
                <button key={icon} type="button" aria-pressed={draft.icon === icon} aria-label={`Ícono ${icon}`} onClick={() => set({ icon })} className={`${tileBtn(draft.icon === icon)} size-14 bg-white`}>
                  <BrandLogo kit={{ ...draft, icon }} name={name} variant="isotipo" size={36} />
                </button>
              ))}
            </div>
          </Group>
        )}

        <Group title="Colores">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {customColors.map((c) => (
              <button key={c.label} type="button" aria-pressed={sameColors(c.colors)} onClick={() => set({ colors: c.colors, palette: "custom" })} className={option(sameColors(c.colors))}>
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
        </Group>

        <Group title="Tipo de letra">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FONT_PAIRS.map((pair) => (
              <button key={pair.id} type="button" aria-pressed={draft.fonts === pair.id} onClick={() => set({ fonts: pair.id })} className={option(draft.fonts === pair.id)}>
                <span className="text-lg" style={{ fontFamily: `"${pair.heading.family}"`, fontWeight: pair.heading.weight, letterSpacing: "-0.02em" }}>
                  {pair.name}
                </span>
              </button>
            ))}
          </div>
        </Group>

        <Group title="Cómo se escribe el nombre">
          <div className="flex flex-wrap gap-2">
            {NAME_STYLES.map((s) => (
              <button key={s.id} type="button" aria-pressed={draft.nameStyle === s.id} onClick={() => set({ nameStyle: s.id })} className={option(draft.nameStyle === s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </Group>

        <Group title="Fondo de la marca (redes, papelería y página)">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {PATTERNS.map((pt) => (
              <button key={pt.id} type="button" aria-pressed={draft.pattern === pt.id} onClick={() => set({ pattern: pt.id })} className={tileBtn(draft.pattern === pt.id)}>
                <span aria-hidden className="h-12 w-full rounded-lg" style={{ background: backdropCss({ ...draft, pattern: pt.id }, "oscuro") }} />
                {pt.label}
              </button>
            ))}
          </div>
        </Group>

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
