import type { CSSProperties } from "react";
import {
  escapeXml,
  fontsById,
  initials,
  isotypeSvg,
  kitPalette,
  logoName,
  markSvg,
  onColor,
  splitName,
  type BrandKit,
} from "@/lib/brand";

// Logo de un kit de marca para mostrar en pantalla, en sus 4 estilos (clásico, apilado, emblema y
// solo nombre). La tipografía se carga con googleFontsHref(); las descargas usan lib/brand-render.ts
// (mismo diseño, con el texto en trazos). Los SVG salen solo de piezas curadas y el texto va escapado.

type Variant = "principal" | "vertical" | "isotipo" | "sello";
type Theme = "color" | "blanco" | "mono";

function inks(kit: BrandKit, theme: Theme) {
  const p = kitPalette(kit);
  if (theme === "blanco") return { name: "#FFFFFF", accent: "#FFFFFF", caption: "#FFFFFF", mono: "#FFFFFF" as string | undefined };
  if (theme === "mono") return { name: p.dark, accent: p.dark, caption: p.dark, mono: p.dark as string | undefined };
  return { name: p.dark, accent: p.primary, caption: p.primary, mono: undefined };
}

// Emblema: sello redondo con el nombre en curva (textPath del navegador).
function emblemSvg(kit: BrandKit, name: string, theme: Theme) {
  const p = kitPalette(kit);
  const f = fontsById(kit.fonts);
  const filled = theme !== "blanco";
  const bg = theme === "mono" ? p.dark : p.primary;
  const ink = filled ? onColor(bg, p.dark) : "#FFFFFF";
  const top = f.script ? name : name.toLocaleUpperCase("es");
  const bottom = (kit.caption || "").toLocaleUpperCase("es");
  const topSize = Math.min(30, 248 / Math.max(top.length * (f.script ? 0.55 : 0.72), 1));
  const bottomSize = Math.min(15, 200 / Math.max(bottom.length * 0.78, 1));
  const ring = filled
    ? `<circle cx="120" cy="120" r="120" fill="${bg}"/>`
    : `<circle cx="120" cy="120" r="117" fill="none" stroke="#FFFFFF" stroke-width="6"/>`;
  const scale = kit.monogram ? 0.62 : 0.78;
  const mark = `<g transform="translate(72 72)">${markSvg(kit, 96, ink, { initials: initials(name), scale })}</g>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%">` +
    `<defs><path id="ob-arc-top" d="M28 120 A92 92 0 0 1 212 120"/><path id="ob-arc-bottom" d="M9 120 A111 111 0 0 0 231 120"/></defs>` +
    ring +
    `<circle cx="120" cy="120" r="76" fill="none" stroke="${ink}" stroke-width="2.5" stroke-opacity="0.6"/>` +
    `<circle cx="17" cy="120" r="4" fill="${ink}"/><circle cx="223" cy="120" r="4" fill="${ink}"/>` +
    mark +
    `<text fill="${ink}" font-family="${escapeXml(f.heading.family)}" font-weight="${f.heading.weight}" font-size="${topSize.toFixed(1)}" letter-spacing="${f.script ? 0 : topSize * 0.08}"><textPath href="#ob-arc-top" startOffset="50%" text-anchor="middle">${escapeXml(top)}</textPath></text>` +
    (bottom
      ? `<text fill="${ink}" font-family="${escapeXml(f.body.family)}" font-size="${bottomSize.toFixed(1)}" letter-spacing="${bottomSize * 0.14}"><textPath href="#ob-arc-bottom" startOffset="50%" text-anchor="middle">${escapeXml(bottom)}</textPath></text>`
      : "") +
    `</svg>`
  );
}

function Svg({ html, size, label }: { html: string; size: number; label?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="inline-block shrink-0"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function BrandLogo({
  kit,
  name,
  variant = "principal",
  size = 48,
  theme = "color",
  compact = false,
  className = "",
}: {
  kit: BrandKit;
  name: string;
  variant?: Variant;
  size?: number; // alto del símbolo en px
  theme?: Theme;
  compact?: boolean; // en espacios chicos (encabezado de la página), el emblema se muestra como clásico
  className?: string;
}) {
  const p = kitPalette(kit);
  const f = fontsById(kit.fonts);
  const ink = inks(kit, theme);
  const iso = isotypeSvg(kit, { size, mono: ink.mono, initials: initials(name) });
  const text = logoName(kit, name);
  const upper = kit.nameStyle === "mayusculas";
  const nameStyle: CSSProperties = {
    fontFamily: `"${f.heading.family}", system-ui, sans-serif`,
    fontWeight: f.heading.weight,
    lineHeight: 1.05,
    letterSpacing: upper ? "0.04em" : undefined,
    color: ink.name,
    whiteSpace: "nowrap",
  };
  const captionEl = (fontSize: number) =>
    kit.caption ? (
      <span
        style={{
          fontFamily: `"${f.body.family}", system-ui, sans-serif`,
          fontSize,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: ink.caption,
          whiteSpace: "nowrap",
        }}
      >
        {kit.caption}
      </span>
    ) : null;
  const twoTone = (t: string) => {
    if (kit.nameStyle !== "dos-tonos" || theme !== "color") return t;
    const [a, b] = splitName(t);
    return b ? (
      <>
        {a} <span style={{ color: ink.accent }}>{b}</span>
      </>
    ) : (
      t
    );
  };
  const label = `Logo de ${name}`;

  if (variant === "isotipo") return <Svg html={iso} size={size} label={`Símbolo de ${name}`} />;
  if (variant === "sello" || (variant === "principal" && kit.layout === "emblema" && !compact)) {
    return <Svg html={emblemSvg(kit, name, variant === "sello" && theme === "color" ? "mono" : theme)} size={size * 2} label={label} />;
  }

  if (variant === "vertical") {
    return (
      <span role="img" aria-label={label} className={`inline-flex flex-col items-center text-center ${className}`} style={{ gap: size * 0.2 }}>
        <Svg html={iso} size={size} />
        <span style={{ ...nameStyle, fontSize: size * 0.45 }}>{twoTone(text)}</span>
        {captionEl(size * 0.13)}
      </span>
    );
  }

  if (kit.layout === "palabra" && !compact) {
    return (
      <span role="img" aria-label={label} className={`inline-flex flex-col ${className}`} style={{ gap: size * 0.1 }}>
        <span style={{ ...nameStyle, fontSize: size * 0.8 }}>
          {twoTone(text)}
          <span style={{ color: theme === "color" ? p.accent : ink.name }}>.</span>
        </span>
        {captionEl(size * 0.17)}
      </span>
    );
  }

  if (kit.layout === "apilado" && !compact) {
    const [l1, l2] = splitName(text);
    const two = kit.nameStyle === "dos-tonos" && theme === "color";
    return (
      <span role="img" aria-label={label} className={`inline-flex items-center ${className}`} style={{ gap: size * 0.23 }}>
        <Svg html={iso} size={size} />
        <span className="flex flex-col" style={{ gap: size * 0.04 }}>
          <span style={{ ...nameStyle, fontSize: size * 0.42 }}>{l1}</span>
          {l2 && <span style={{ ...nameStyle, fontSize: size * 0.42, color: two ? p.primary : ink.name }}>{l2}</span>}
          {captionEl(size * 0.12)}
        </span>
      </span>
    );
  }

  return (
    <span role="img" aria-label={label} className={`inline-flex items-center ${className}`} style={{ gap: size * 0.25 }}>
      <Svg html={iso} size={size} />
      <span style={{ ...nameStyle, fontSize: size * (upper ? 0.46 : 0.52) }}>{twoTone(text)}</span>
    </span>
  );
}
