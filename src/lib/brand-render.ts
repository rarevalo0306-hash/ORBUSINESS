import "server-only";
import { ImageResponse } from "next/og";
import { parse } from "opentype.js";
import { createElement } from "react";
import { fontsById, initials, isotypeSvg, onColor, paletteById, type BrandKit } from "@/lib/brand";

// Descarga (y guarda en memoria) la tipografía TTF de Google Fonts.
const fontCache = new Map<string, Promise<ArrayBuffer>>();
export function loadFont(family: string, weight: number): Promise<ArrayBuffer> {
  const key = `${family}:${weight}`;
  if (!fontCache.has(key)) {
    fontCache.set(
      key,
      (async () => {
        const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`;
        // Con este User-Agent, Google entrega TTF (lo que necesitan opentype y ImageResponse).
        const css = await (await fetch(url, { headers: { "User-Agent": "Mozilla/4.0" } })).text();
        const src = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
        if (!src) throw new Error(`No se encontró la tipografía ${family} ${weight}`);
        return (await fetch(src)).arrayBuffer();
      })().catch((error) => {
        fontCache.delete(key);
        throw error;
      }),
    );
  }
  return fontCache.get(key)!;
}

export async function kitFonts(kit: BrandKit) {
  const pair = fontsById(kit.fonts);
  const [heading, body] = await Promise.all([
    loadFont(pair.heading.family, pair.heading.weight),
    loadFont(pair.body.family, pair.body.weight),
  ]);
  return { pair, heading, body };
}

// Texto convertido a trazos (path) para que el SVG no dependa de tener la tipografía instalada.
function textPath(fontData: ArrayBuffer, text: string, x: number, baseline: number, size: number) {
  const font = parse(fontData);
  const width = font.getAdvanceWidth(text, size);
  return { d: font.getPath(text, x, baseline, size).toPathData(2), width, font };
}

function monogramPath(fontData: ArrayBuffer, name: string, box: number) {
  const font = parse(fontData);
  const text = initials(name);
  const size = box * 0.42;
  const width = font.getAdvanceWidth(text, size);
  const capHeight = ((font.tables.os2 as { sCapHeight?: number })?.sCapHeight ?? font.unitsPerEm * 0.7) / font.unitsPerEm;
  return font.getPath(text, (box - width) / 2, box / 2 + (capHeight * size) / 2, size).toPathData(2);
}

export type LogoLayout = "horizontal" | "vertical" | "isotipo";
export type LogoTheme = "color" | "blanco" | "mono";

// SVG del logo listo para descargar (texto en trazos, fondo transparente).
export async function logoSvg(kit: BrandKit, name: string, layout: LogoLayout, theme: LogoTheme = "color") {
  const { heading } = await kitFonts(kit);
  const p = paletteById(kit.palette);
  const isoSize = 120;
  const mono = theme === "mono" ? p.dark : theme === "blanco" ? "#FFFFFF" : undefined;
  const mPath = kit.monogram ? monogramPath(heading, name, isoSize) : undefined;
  const isoKit = theme === "blanco" ? { ...kit, shape: "none" as const } : kit;
  const iso = isotypeSvg(isoKit, { size: isoSize, mono, monogramPath: mPath })
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "");
  const textColor = theme === "blanco" ? "#FFFFFF" : p.dark;

  if (layout === "isotipo") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${isoSize} ${isoSize}" width="${isoSize * 4}" height="${isoSize * 4}">${iso}</svg>`;
  }
  if (layout === "horizontal") {
    const size = 62;
    const gap = 30;
    const text = textPath(heading, name, isoSize + gap, isoSize / 2 + size * 0.36, size);
    const w = Math.ceil(isoSize + gap + text.width + 8);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${isoSize}" width="${w * 2}" height="${isoSize * 2}"><g>${iso}</g><path d="${text.d}" fill="${textColor}"/></svg>`;
  }
  const size = 54;
  const gap = 26;
  const textProbe = textPath(heading, name, 0, 0, size);
  const w = Math.ceil(Math.max(isoSize, textProbe.width) + 16);
  const text = textPath(heading, name, (w - textProbe.width) / 2, isoSize + gap + size * 0.8, size);
  const h = Math.ceil(isoSize + gap + size * 1.05);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}"><g transform="translate(${(w - isoSize) / 2} 0)">${iso}</g><path d="${text.d}" fill="${textColor}"/></svg>`;
}

// Isotipo para fondos de color (perfil, portada): solo el símbolo, en el color legible sobre el fondo.
export async function isotypeOnColor(kit: BrandKit, name: string, bg: string, size = 240) {
  const { heading } = await kitFonts(kit);
  const p = paletteById(kit.palette);
  const ink = onColor(bg, p.dark);
  const mPath = kit.monogram ? monogramPath(heading, name, size) : undefined;
  return isotypeSvg({ ...kit, shape: "none" }, { size, mono: ink, monogramPath: mPath });
}

export const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

// PNG del logo (fondo transparente), a partir del SVG en trazos.
export async function logoPng(
  kit: BrandKit,
  name: string,
  layout: LogoLayout,
  width: number,
  headers?: Record<string, string>,
) {
  const svg = await logoSvg(kit, name, layout);
  const [, vw, vh] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)!.map(Number);
  const height = Math.round((width * vh) / vw);
  return new ImageResponse(createElement("img", { src: svgDataUri(svg), width, height, alt: "" }), { width, height, headers });
}
