import "server-only";
import { parse, type Font } from "opentype.js";
import {
  aiMarkInner,
  fontsById,
  isModernMark,
  markChar,
  markChar2,
  accentIndex,
  accentLetterColor,
  acronym,
  symbolIndex,
  mixHex,
  nameTracking,
  initials,
  isotypeSvg,
  kitPalette,
  logoName,
  markScale,
  markSvg,
  onColor,
  splitName,
  type BrandKit,
} from "@/lib/brand";
import { MONO_X, letterCenter, letterSize, modernMark } from "@/lib/brand-marks";

// Motor de dibujo del kit de marca: todo se arma como SVG con el texto convertido a trazos,
// para que los archivos no dependan de tener la tipografía instalada (imprenta, Illustrator, etc.).

// ---------- Tipografías ----------

// Descarga (y guarda en memoria) la tipografía TTF de Google Fonts.
const fontCache = new Map<string, Promise<Font>>();
export function loadFont(family: string, weight: number): Promise<Font> {
  const key = `${family}:${weight}`;
  if (!fontCache.has(key)) {
    fontCache.set(
      key,
      (async () => {
        const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`;
        // Con este User-Agent, Google entrega TTF (lo que necesita opentype).
        const css = await (await fetch(url, { headers: { "User-Agent": "Mozilla/4.0" } })).text();
        const src = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
        if (!src) throw new Error(`No se encontró la tipografía ${family} ${weight}`);
        return parse(await (await fetch(src)).arrayBuffer());
      })().catch((error) => {
        fontCache.delete(key);
        throw error;
      }),
    );
  }
  return fontCache.get(key)!;
}

export type KitFonts = { heading: Font; body: Font };

export async function kitFonts(kit: BrandKit): Promise<KitFonts> {
  const pair = fontsById(kit.fonts);
  const [heading, body] = await Promise.all([
    loadFont(pair.heading.family, pair.heading.weight),
    loadFont(pair.body.family, pair.body.weight),
  ]);
  return { heading, body };
}

// ---------- Texto en trazos ----------

export const xRatio = (font: Font) =>
  ((font.tables.os2 as { sxHeight?: number } | undefined)?.sxHeight || font.unitsPerEm * 0.5) / font.unitsPerEm;

export const capRatio = (font: Font) =>
  ((font.tables.os2 as { sCapHeight?: number } | undefined)?.sCapHeight || font.unitsPerEm * 0.7) / font.unitsPerEm;

// Las letras se colocan una por una (sin las sustituciones avanzadas de la fuente, que algunas
// tipografías traen en formatos que opentype no soporta). tracking: espacio extra entre letras,
// en proporción del tamaño (0.1 = 10 %).
type Glyph = ReturnType<Font["charToGlyph"]>;
const glyphsOf = (font: Font, text: string) => Array.from(text).map((c) => font.charToGlyph(c));
function kern(font: Font, a: Glyph, b: Glyph) {
  try {
    const v = Number(font.getKerningValue(a, b));
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

function layout(font: Font, text: string, size: number, tracking: number, draw?: (g: Glyph, x: number) => void) {
  const gs = glyphsOf(font, text);
  const k = size / font.unitsPerEm;
  let x = 0;
  gs.forEach((g, i) => {
    draw?.(g, x);
    x += (Number.isFinite(g.advanceWidth) ? g.advanceWidth! : 0) * k;
    if (i < gs.length - 1) x += kern(font, g, gs[i + 1]) * k + tracking * size;
  });
  return x;
}

export const measure = (font: Font, text: string, size: number, tracking = 0) => layout(font, text, size, tracking);

// Trazo SVG de un glifo (se arma a mano: toPathData de opentype a veces escribe "NaN").
type PathCmd = { type: string; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number };
const n = (v: number | undefined) => (Number.isFinite(v) ? Number(v!.toFixed(2)) : 0);
function pathData(commands: PathCmd[]) {
  let d = "";
  for (const c of commands) {
    if (c.type === "M" || c.type === "L") d += `${c.type}${n(c.x)} ${n(c.y)}`;
    else if (c.type === "Q") d += `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === "C") d += `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === "Z") d += "Z";
  }
  return d;
}
const glyphPath = (g: Glyph, x: number, baseline: number, size: number) => pathData(g.getPath(x, baseline, size).commands as PathCmd[]);

function textPath(font: Font, text: string, x: number, baseline: number, size: number, tracking = 0) {
  let d = "";
  layout(font, text, size, tracking, (g, gx) => {
    d += glyphPath(g, x + gx, baseline, size);
  });
  return d;
}

const charPath = (font: Font, c: string, x: number, baseline: number, size: number) => glyphPath(font.charToGlyph(c), x, baseline, size);

// Texto alineado en trazos.
export function textSvg(
  font: Font,
  text: string,
  x: number,
  baseline: number,
  size: number,
  fill: string,
  opts: { anchor?: "start" | "middle" | "end"; tracking?: number; opacity?: number } = {},
) {
  if (!text) return "";
  const w = measure(font, text, size, opts.tracking);
  const left = opts.anchor === "middle" ? x - w / 2 : opts.anchor === "end" ? x - w : x;
  const d = textPath(font, text, left, baseline, size, opts.tracking);
  return d ? `<path d="${d}" fill="${fill}"${opts.opacity != null ? ` fill-opacity="${opts.opacity}"` : ""}/>` : "";
}

// Parte el texto en líneas que caben en maxWidth.
export function wrap(font: Font, text: string, size: number, maxWidth: number, tracking = 0) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(font, next, size, tracking) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// Párrafo: achica la letra hasta que quepa en maxLines.
export function paragraphSvg(
  font: Font,
  text: string,
  x: number,
  top: number,
  maxWidth: number,
  size: number,
  fill: string,
  opts: { anchor?: "start" | "middle" | "end"; lineHeight?: number; maxLines?: number; minSize?: number; tracking?: number; opacity?: number } = {},
) {
  const tr = opts.tracking ?? 0;
  let s = size;
  let lines = wrap(font, text, s, maxWidth, tr);
  while ((lines.length > (opts.maxLines ?? 4) || lines.some((l) => measure(font, l, s, tr) > maxWidth)) && s > (opts.minSize ?? size * 0.5)) {
    s *= 0.92;
    lines = wrap(font, text, s, maxWidth, tr);
  }
  const lh = s * (opts.lineHeight ?? 1.15);
  const cap = capRatio(font) * s;
  const svg = lines.map((l, i) => textSvg(font, l, x, top + cap + i * lh, s, fill, { anchor: opts.anchor, tracking: tr, opacity: opts.opacity })).join("");
  return { svg, height: cap + (lines.length - 1) * lh, size: s, lines: lines.length };
}

// Texto curvo (para el emblema). Arriba se lee por fuera del círculo; abajo, por dentro.
function arcText(font: Font, text: string, cx: number, cy: number, r: number, size: number, position: "top" | "bottom", tracking: number) {
  const chars = Array.from(text);
  const adv = chars.map((c) => measure(font, c, size));
  const total = adv.reduce((a, b) => a + b, 0) + tracking * size * (chars.length - 1);
  const span = total / r;
  let acc = 0;
  let out = "";
  chars.forEach((c, i) => {
    const mid = acc + adv[i] / 2;
    acc += adv[i] + tracking * size;
    const phi = position === "top" ? -Math.PI / 2 - span / 2 + mid / r : Math.PI / 2 + span / 2 - mid / r;
    const px = cx + r * Math.cos(phi);
    const py = cy + r * Math.sin(phi);
    const rot = ((position === "top" ? phi + Math.PI / 2 : phi - Math.PI / 2) * 180) / Math.PI;
    const d = charPath(font, c, -adv[i] / 2, 0, size);
    if (d) out += `<path transform="translate(${px.toFixed(2)} ${py.toFixed(2)}) rotate(${rot.toFixed(2)})" d="${d}"/>`;
  });
  return out;
}

// Tamaño de letra para que un texto curvo ocupe como máximo `share` de media circunferencia.
function arcSize(font: Font, text: string, r: number, max: number, share: number, tracking: number) {
  const width = measure(font, text, 100, tracking);
  return Math.min(max, (Math.PI * r * share * 100) / Math.max(width, 1));
}

// Iniciales centradas en un cuadro (trazos).
function monogramPath(font: Font, name: string, box: number, scale: number) {
  const text = initials(name);
  const size = box * 0.75 * scale;
  const width = measure(font, text, size);
  return textPath(font, text, (box - width) / 2, box / 2 + (capRatio(font) * size) / 2, size);
}

// ---------- Piezas (arte con capas, para SVG, PNG, JPG, PDF y PSD) ----------

export type Layer = { name: string; svg: string };
export type Art = { width: number; height: number; layers: Layer[] };

export const artSvg = (art: Art, scale = 1) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.width} ${art.height}" width="${art.width * scale}" height="${art.height * scale}">${art.layers
    .map((l) => `<g>${l.svg}</g>`)
    .join("")}</svg>`;

// Coloca un arte dentro de un cuadro (x, y, maxW, maxH). Devuelve el SVG y dónde quedó.
export function place(art: Art, x: number, y: number, maxW: number, maxH: number, align: "center" | "start" | "end" = "center") {
  const k = Math.min(maxW / art.width, maxH / art.height);
  const w = art.width * k;
  const h = art.height * k;
  const ox = align === "center" ? x + (maxW - w) / 2 : align === "end" ? x + maxW - w : x;
  const oy = y + (maxH - h) / 2;
  return {
    svg: `<g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${k.toFixed(5)})">${art.layers.map((l) => l.svg).join("")}</g>`,
    w,
    h,
    x: ox,
    y: oy,
  };
}

// ---------- Logo ----------

export type LogoVariant = "principal" | "vertical" | "isotipo" | "sello";
export type LogoTheme = "color" | "blanco" | "mono";

function inkFor(kit: BrandKit, theme: LogoTheme) {
  const p = kitPalette(kit);
  if (theme === "blanco") return { name: "#FFFFFF", accent: "#FFFFFF", caption: "#FFFFFF", mono: "#FFFFFF" };
  if (theme === "mono") return { name: p.dark, accent: p.dark, caption: p.dark, mono: p.dark };
  return { name: p.dark, accent: p.primary, caption: p.primary, mono: undefined };
}

// Inicial del símbolo moderno, en trazos, centrada en el cuadro de 100.
function markLetterPath(kit: BrandKit, name: string, fonts: KitFonts, which: 0 | 1 = 0) {
  const size = letterSize(kit.mark);
  const char = which === 0 ? markChar(name) : markChar2(name);
  const w = measure(fonts.heading, char, size);
  const cx = kit.mark === "monograma" ? MONO_X[which] : 50;
  return textPath(fonts.heading, char, cx - w / 2, letterCenter(kit.mark) + (capRatio(fonts.heading) * size) / 2, size);
}

function isoLayer(kit: BrandKit, name: string, fonts: KitFonts, size: number, theme: LogoTheme) {
  if (isModernMark(kit.mark)) {
    const inner = isotypeSvg(kit, { size: 100, theme, initials: name, letterPath: markLetterPath(kit, name, fonts), letterPath2: kit.mark === "monograma" ? markLetterPath(kit, name, fonts, 1) : undefined })
      .replace(/^<svg[^>]*>/, "")
      .replace(/<\/svg>$/, "");
    return `<g transform="scale(${size / 100})">${inner}</g>`;
  }
  const mPath = kit.monogram ? monogramPath(fonts.heading, name, size, markScale(kit.shape)) : undefined;
  return isotypeSvg(kit, { size, mono: inkFor(kit, theme).mono, monogramPath: mPath })
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");
}

// Nombre en una línea (a dos colores si el kit lo pide).
function nameRun(kit: BrandKit, fonts: KitFonts, text: string, x: number, baseline: number, size: number, theme: LogoTheme, anchor: "start" | "middle" = "start", name = text) {
  const ink = inkFor(kit, theme);
  const tracking = nameTracking(kit);
  const width = measure(fonts.heading, text, size, tracking);
  const left = anchor === "middle" ? x - width / 2 : x;
  if (kit.nameStyle === "letra-simbolo") {
    // Una letra redonda (la "o") se cambia por el símbolo, como los logotipos que esconden una idea.
    const chars = Array.from(text);
    const i = symbolIndex(text);
    if (i > 0) {
      const upper = chars[i] !== chars[i].toLocaleLowerCase("es");
      const ratio = upper ? capRatio(fonts.heading) : xRatio(fonts.heading);
      const markH = size * ratio * 1.12;
      const side = size * 0.04;
      const before = chars.slice(0, i).join("");
      const after = chars.slice(i + 1).join("");
      const wb = measure(fonts.heading, before, size, tracking) + tracking * size;
      const wm = markH + 2 * side;
      const total = wb + wm + (after ? measure(fonts.heading, after, size, tracking) : 0);
      const l = anchor === "middle" ? x - total / 2 : x;
      return {
        svg:
          textSvg(fonts.heading, before, l, baseline, size, ink.name, { tracking }) +
          `<g transform="translate(${(l + wb + side).toFixed(2)} ${(baseline - markH + size * 0.01).toFixed(2)})">${isoLayer(kit, name, fonts, markH, theme)}</g>` +
          textSvg(fonts.heading, after, l + wb + wm, baseline, size, ink.name, { tracking }),
        width: total,
      };
    }
  }
  if (kit.nameStyle === "dos-tonos" && theme === "color") {
    const [a, b] = splitName(text);
    if (b) {
      const wa = measure(fonts.heading, `${a} `, size, tracking);
      return {
        svg: textSvg(fonts.heading, a, left, baseline, size, ink.name, { tracking }) + textSvg(fonts.heading, b, left + wa, baseline, size, ink.accent, { tracking }),
        width,
      };
    }
  }
  if ((kit.nameStyle === "letra-acento" || kit.nameStyle === "letra-simbolo") && theme === "color") {
    // Una sola letra en color (como la "o" roja de Mobil).
    const chars = Array.from(text);
    const i = accentIndex(text);
    const before = chars.slice(0, i).join("");
    const after = chars.slice(i + 1).join("");
    const wb = before ? measure(fonts.heading, before, size, tracking) + tracking * size : 0;
    const wc = measure(fonts.heading, chars[i], size, tracking) + tracking * size;
    return {
      svg:
        textSvg(fonts.heading, before, left, baseline, size, ink.name, { tracking }) +
        textSvg(fonts.heading, chars[i], left + wb, baseline, size, accentLetterColor(kitPalette(kit)), { tracking }) +
        textSvg(fonts.heading, after, left + wb + wc, baseline, size, ink.name, { tracking }),
      width,
    };
  }
  if (kit.nameStyle === "dos-pesos") {
    // Primera parte en la letra gruesa de títulos; la segunda, en la delgada de textos.
    const [a, b] = splitName(text);
    if (b) {
      const wa = measure(fonts.heading, `${a} `, size, tracking);
      const w2 = wa + measure(fonts.body, b, size, tracking);
      const l2 = anchor === "middle" ? x - w2 / 2 : x;
      return {
        svg: textSvg(fonts.heading, a, l2, baseline, size, ink.name, { tracking }) + textSvg(fonts.body, b, l2 + wa, baseline, size, ink.name, { tracking }),
        width: w2,
      };
    }
  }
  return { svg: textSvg(fonts.heading, text, left, baseline, size, ink.name, { tracking }), width };
}

function emblem(kit: BrandKit, name: string, fonts: KitFonts, theme: LogoTheme): Art {
  const p = kitPalette(kit);
  const S = 240;
  const c = S / 2;
  const filled = theme !== "blanco";
  const bg = theme === "mono" ? p.dark : p.primary;
  const ink = filled ? onColor(bg, p.dark) : "#FFFFFF";
  const script = fontsById(kit.fonts).script;
  const top = script ? name : name.toLocaleUpperCase("es");
  const topTracking = script ? 0 : 0.08;
  const topSize = arcSize(fonts.heading, top, 92, 30, 0.86, topTracking);
  const bottom = (kit.caption || "").toLocaleUpperCase("es");
  const bottomSize = bottom ? arcSize(fonts.body, bottom, 103, 15, 0.62, 0.14) : 0;
  const ring = filled
    ? `<circle cx="${c}" cy="${c}" r="${c}" fill="${bg}"/>`
    : `<circle cx="${c}" cy="${c}" r="${c - 3}" fill="none" stroke="#FFFFFF" stroke-width="6"/>`;
  const inner = `<circle cx="${c}" cy="${c}" r="76" fill="none" stroke="${ink}" stroke-width="2.5" stroke-opacity="0.6"/>`;
  const dots = `<circle cx="${c - 103}" cy="${c}" r="4" fill="${ink}"/><circle cx="${c + 103}" cy="${c}" r="4" fill="${ink}"/>`;
  const markSize = 96;
  const scale = kit.monogram ? 0.62 : 0.78;
  const mPath = kit.monogram ? monogramPath(fonts.heading, name, markSize, scale) : undefined;
  const mark = kit.mark === "ia" && kit.aiMark
    ? `<g transform="translate(${c - 40} ${c - 40}) scale(0.8)">${aiMarkInner(kit, ink)}</g>`
    : isModernMark(kit.mark)
    ? `<g transform="translate(${c - 40} ${c - 40}) scale(0.8)">${modernMark(kit.mark, { a: ink, b: mixHex(ink, bg, 0.4), c: mixHex(ink, bg, 0.2), on: filled ? bg : p.primary }, { icon: kit.icon, letter: { path: markLetterPath(kit, name, fonts), char: markChar(name), family: "", weight: 400 }, letter2: { path: markLetterPath(kit, name, fonts, 1), char: markChar2(name), family: "", weight: 400 } })}</g>`
    : `<g transform="translate(${c - markSize / 2} ${c - markSize / 2})">${markSvg(kit, markSize, ink, { monogramPath: mPath, scale })}</g>`;
  return {
    width: S,
    height: S,
    layers: [
      { name: "Sello", svg: ring + inner + dots },
      { name: "Símbolo", svg: mark },
      {
        name: "Nombre",
        svg: `<g fill="${ink}">${arcText(fonts.heading, top, c, c, 92, topSize, "top", topTracking)}${
          bottom ? arcText(fonts.body, bottom, c, c, 103 + bottomSize * 0.72, bottomSize, "bottom", 0.14) : ""
        }</g>`,
      },
    ],
  };
}

export async function logoArt(kit: BrandKit, name: string, variant: LogoVariant = "principal", theme: LogoTheme = "color", fonts?: KitFonts): Promise<Art> {
  fonts ??= await kitFonts(kit);
  const text = logoName(kit, name);
  const ink = inkFor(kit, theme);
  const cap = capRatio(fonts.heading);
  const capB = capRatio(fonts.body);
  const caption = kit.caption.toLocaleUpperCase("es");
  const captionSvg = (x: number, baseline: number, size: number, anchor: "start" | "middle") =>
    caption ? textSvg(fonts.body, caption, x, baseline, size, ink.caption, { anchor, tracking: 0.16 }) : "";

  if (variant === "sello") return emblem(kit, name, fonts, theme);
  if (variant === "isotipo") return { width: 120, height: 120, layers: [{ name: "Símbolo", svg: isoLayer(kit, name, fonts, 120, theme) }] };
  if (variant === "principal" && kit.layout === "emblema") return emblem(kit, name, fonts, theme);

  if (variant === "vertical" || kit.layout === "centrado") {
    const iso = 120;
    const size = 54;
    const run = nameRun(kit, fonts, text, 0, 0, size, theme, "start", name);
    const capW = caption ? measure(fonts.body, caption, 16, 0.16) : 0;
    const w = Math.ceil(Math.max(iso, run.width, capW) + 16);
    const nameBase = iso + 28 + cap * size;
    const h = Math.ceil(nameBase + (caption ? 34 : 10));
    return {
      width: w,
      height: h,
      layers: [
        { name: "Símbolo", svg: `<g transform="translate(${(w - iso) / 2} 0)">${isoLayer(kit, name, fonts, iso, theme)}</g>` },
        { name: "Nombre", svg: nameRun(kit, fonts, text, w / 2, nameBase, size, theme, "middle", name).svg },
        ...(caption ? [{ name: "Texto pequeño", svg: captionSvg(w / 2, nameBase + 30, 16, "middle") }] : []),
      ],
    };
  }

  if (kit.layout === "siglas") {
    // Monograma (como IBM o CNN): las siglas en grande y el nombre completo debajo.
    const sig = acronym(name);
    const p = kitPalette(kit);
    const S = 150;
    const sigW = measure(fonts.heading, sig, S, -0.03);
    const nameSize = 30;
    const nameW = measure(fonts.heading, text, nameSize, nameTracking(kit));
    const capW = caption ? measure(fonts.body, caption, 16, 0.16) : 0;
    const sigBase = cap * S;
    const nameBase = sigBase + 30 + cap * nameSize;
    const captionBase = nameBase + 22 + capB * 16;
    return {
      width: Math.ceil(Math.max(sigW, nameW, capW) + 8),
      height: Math.ceil((caption ? captionBase : nameBase) + 8),
      layers: [
        { name: "Siglas", svg: textSvg(fonts.heading, sig, 0, sigBase, S, theme === "color" ? p.primary : ink.name, { tracking: -0.03 }) },
        { name: "Nombre", svg: textSvg(fonts.heading, text, 2, nameBase, nameSize, ink.name, { tracking: nameTracking(kit) }) },
        ...(caption ? [{ name: "Texto pequeño", svg: captionSvg(2, captionBase, 16, "start") }] : []),
      ],
    };
  }

  if (kit.layout === "insignia") {
    // Isologotipo (como Starbucks o Burger King): símbolo y nombre dentro de una sola forma.
    const p = kitPalette(kit);
    const fill = theme === "blanco" ? "#FFFFFF" : theme === "mono" ? p.dark : p.primary;
    const inner: LogoTheme = theme === "blanco" ? "color" : "blanco";
    const iso = 92;
    const padY = 26;
    const size = 52;
    const h = iso + padY * 2;
    const run = nameRun(kit, fonts, text, padY + iso + 24, h / 2 + (cap * size) / 2, size, inner, "start", name);
    const w = Math.ceil(padY + iso + 24 + run.width + h * 0.42);
    return {
      width: w,
      height: h,
      layers: [
        { name: "Insignia", svg: `<rect width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"/>` },
        { name: "Símbolo", svg: `<g transform="translate(${padY} ${padY})">${isoLayer(kit, name, fonts, iso, inner)}</g>` },
        { name: "Nombre", svg: run.svg },
      ],
    };
  }

  if (kit.layout === "firma") {
    // El nombre con un trazo curvo debajo, como una firma.
    const size = 96;
    const run = nameRun(kit, fonts, text, 0, cap * size, size, theme, "start", name);
    const w = Math.ceil(run.width + 8);
    const y = cap * size + size * 0.24;
    const stroke = theme === "color" ? accentLetterColor(kitPalette(kit)) : ink.name;
    const swoosh = `<path d="M${w * 0.03} ${y + size * 0.05}Q${w * 0.42} ${y + size * 0.34} ${w * 0.97} ${y - size * 0.1}" fill="none" stroke="${stroke}" stroke-width="${size * 0.075}" stroke-linecap="round"/>`;
    const captionBase = y + size * 0.3 + 22 + capB * 24;
    const h = Math.ceil(caption ? captionBase + 6 : y + size * 0.32);
    return {
      width: w,
      height: h,
      layers: [
        { name: "Nombre", svg: run.svg },
        { name: "Trazo", svg: swoosh },
        ...(caption ? [{ name: "Texto pequeño", svg: captionSvg(4, captionBase, 24, "start") }] : []),
      ],
    };
  }

  if (kit.layout === "palabra") {
    const size = 96;
    const run = nameRun(kit, fonts, text, 0, cap * size, size, theme, "start", name);
    const p = kitPalette(kit);
    const r = size * 0.085;
    // El punto de color sobra si una letra ya es el símbolo.
    const noDot = kit.nameStyle === "letra-simbolo" && symbolIndex(text) > 0;
    const dot = noDot ? "" : `<circle cx="${run.width + r * 2.2}" cy="${cap * size - r}" r="${r}" fill="${theme === "color" ? p.accent : ink.name}"/>`;
    const w = Math.ceil(run.width + (dot ? r * 3.6 : 8));
    const captionBase = cap * size + 26 + capB * 26;
    const h = Math.ceil(caption ? captionBase + 6 : cap * size + 8);
    return {
      width: w,
      height: h,
      layers: [
        { name: "Nombre", svg: run.svg },
        ...(dot ? [{ name: "Detalle", svg: dot }] : []),
        ...(caption ? [{ name: "Texto pequeño", svg: captionSvg(2, captionBase, 26, "start") }] : []),
      ],
    };
  }

  if (kit.layout === "apilado") {
    const iso = 120;
    const size = 50;
    const [l1, l2] = splitName(text);
    const lh = size * 1.02;
    const lines = l2 ? [l1, l2] : [l1];
    const blockH = cap * size + (lines.length - 1) * lh + (caption ? 14 + capB * 15 : 0);
    const h = Math.max(iso, Math.ceil(blockH + 4));
    const top = (h - blockH) / 2;
    const p = kitPalette(kit);
    const two = kit.nameStyle === "dos-tonos" && theme === "color";
    const tracking = nameTracking(kit);
    const x = iso + 28;
    const light = (i: number) => kit.nameStyle === "dos-pesos" && i === 1;
    const nameSvg = lines
      .map((l, i) => textSvg(light(i) ? fonts.body : fonts.heading, l, x, top + cap * size + i * lh, size, two && i === 1 ? p.primary : ink.name, { tracking }))
      .join("");
    const widths = lines.map((l, i) => measure(light(i) ? fonts.body : fonts.heading, l, size, tracking));
    const capW = caption ? measure(fonts.body, caption, 15, 0.16) : 0;
    return {
      width: Math.ceil(x + Math.max(...widths, capW) + 6),
      height: h,
      layers: [
        { name: "Símbolo", svg: `<g transform="translate(0 ${(h - iso) / 2})">${isoLayer(kit, name, fonts, iso, theme)}</g>` },
        { name: "Nombre", svg: nameSvg },
        ...(caption ? [{ name: "Texto pequeño", svg: captionSvg(x + 2, top + cap * size + (lines.length - 1) * lh + 14 + capB * 15, 15, "start") }] : []),
      ],
    };
  }

  // Clásico.
  const iso = 120;
  const size = kit.nameStyle === "mayusculas" ? 52 : 64;
  const run = nameRun(kit, fonts, text, iso + 32, iso / 2 + (cap * size) / 2, size, theme, "start", name);
  return {
    width: Math.ceil(iso + 32 + run.width + 6),
    height: iso,
    layers: [
      { name: "Símbolo", svg: isoLayer(kit, name, fonts, iso, theme) },
      { name: "Nombre", svg: run.svg },
    ],
  };
}

// SVG del logo listo para descargar (texto en trazos, fondo transparente).
export async function logoSvg(kit: BrandKit, name: string, variant: LogoVariant = "principal", theme: LogoTheme = "color") {
  return artSvg(await logoArt(kit, name, variant, theme));
}

export const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
