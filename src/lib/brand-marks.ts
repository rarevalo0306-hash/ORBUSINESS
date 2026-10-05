// Símbolos modernos para los logos: formas geométricas simples (estilo Bauhaus / suizo),
// letras protagonistas y un ícono a dos tonos. Todo se dibuja en un cuadro de 100 × 100.
// Sirve en el navegador y en el servidor (la letra en el servidor llega ya convertida en trazos).

import { BRAND_ICONS } from "@/lib/brand-icons";

export type MarkId =
  | "arco"
  | "circulos"
  | "medialuna"
  | "petalo"
  | "escalera"
  | "cuartos"
  | "letra-circulo"
  | "letra-squircle"
  | "letra-arco"
  | "letra-sola"
  | "icono-duo"
  | "icono-squircle"
  | "clasico"; // estilo anterior (forma + ícono), se conserva para kits viejos

export const MARKS: { id: Exclude<MarkId, "clasico">; label: string; kind: "forma" | "letra" | "icono" }[] = [
  { id: "letra-circulo", label: "Letra en círculo", kind: "letra" },
  { id: "letra-squircle", label: "Letra en cuadro suave", kind: "letra" },
  { id: "letra-arco", label: "Letra en arco", kind: "letra" },
  { id: "letra-sola", label: "Letra con punto", kind: "letra" },
  { id: "arco", label: "Arco y sol", kind: "forma" },
  { id: "circulos", label: "Dos círculos", kind: "forma" },
  { id: "medialuna", label: "Círculo partido", kind: "forma" },
  { id: "petalo", label: "Pétalo", kind: "forma" },
  { id: "escalera", label: "Crecimiento", kind: "forma" },
  { id: "cuartos", label: "Bloques", kind: "forma" },
  { id: "icono-duo", label: "Ícono a dos tonos", kind: "icono" },
  { id: "icono-squircle", label: "Ícono en cuadro suave", kind: "icono" },
];

export const SQUIRCLE = "M50 0C88 0 100 12 100 50S88 100 50 100 0 88 0 50 12 0 50 0Z";
const ARCH = "M0 100V50A50 50 0 0 1 100 50V100Z";

export type MarkColors = {
  a: string; // color principal del símbolo
  b: string; // segundo color
  c: string; // tercer color (detalles)
  on: string; // color de la letra o el ícono encima de la forma
};

// Letra: en el servidor viene como trazo ya centrado en el cuadro de 100; en pantalla como <text>.
export type MarkLetter = { path?: string; char: string; family: string; weight: number; dy?: number };

function letterSvg(letter: MarkLetter, color: string, size: number, cx = 50, cy = 50) {
  if (letter.path) return `<path d="${letter.path}" fill="${color}"/>`;
  const safe = letter.char.replace(/[<>&"']/g, "");
  return `<text x="${cx}" y="${cy + (letter.dy ?? 0)}" text-anchor="middle" dominant-baseline="central" font-family="${letter.family}" font-weight="${letter.weight}" font-size="${size}" fill="${color}">${safe}</text>`;
}

function iconSvg(icon: string, color: string, box: number, x: number, y: number, stroke = 2.25) {
  return `<g transform="translate(${x} ${y}) scale(${box / 24})" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${BRAND_ICONS[icon] ?? BRAND_ICONS.store}</g>`;
}

// Tamaño de la letra (en el cuadro de 100) según el símbolo.
export const letterSize = (mark: MarkId) => (mark === "letra-sola" ? 96 : mark === "letra-arco" ? 52 : 58);
// Centro vertical de la letra (el arco la baja un poco).
export const letterCenter = (mark: MarkId) => (mark === "letra-arco" ? 60 : mark === "letra-sola" ? 50 : 50);

// SVG interno del símbolo (sin la etiqueta <svg>) en un cuadro de 100 × 100.
export function modernMark(mark: MarkId, colors: MarkColors, opts: { icon: string; letter: MarkLetter }) {
  const { a, b, c, on } = colors;
  const L = opts.letter;
  switch (mark) {
    case "arco":
      return `<path d="${ARCH}" fill="${a}"/><circle cx="50" cy="56" r="17" fill="${b}"/>`;
    case "circulos":
      return `<circle cx="36" cy="50" r="33" fill="${a}"/><circle cx="64" cy="50" r="33" fill="${b}"/><path d="M50 20.12A33 33 0 0 1 50 79.88A33 33 0 0 1 50 20.12Z" fill="${c}"/>`;
    case "medialuna":
      return `<path d="M6 46A44 44 0 0 1 94 46Z" fill="${a}"/><path d="M6 54A44 44 0 0 0 94 54Z" fill="${b}"/>`;
    case "petalo":
      return `<path d="M8 92A84 84 0 0 1 92 8A84 84 0 0 1 8 92Z" fill="${a}"/><circle cx="82" cy="82" r="13" fill="${b}"/>`;
    case "escalera":
      return `<rect x="4" y="58" width="26" height="38" rx="9" fill="${a}"/><rect x="37" y="32" width="26" height="64" rx="9" fill="${a}"/><rect x="70" y="4" width="26" height="92" rx="9" fill="${b}"/>`;
    case "cuartos":
      return `<path d="M48 48H4A44 44 0 0 1 48 4Z" fill="${a}"/><rect x="54" y="4" width="42" height="42" rx="10" fill="${b}"/><circle cx="26" cy="74" r="22" fill="${c}"/><path d="M52 52H96A44 44 0 0 1 52 96Z" fill="${a}"/>`;
    case "letra-circulo":
      return `<circle cx="50" cy="50" r="50" fill="${a}"/>${letterSvg(L, on, letterSize(mark))}`;
    case "letra-squircle":
      return `<path d="${SQUIRCLE}" fill="${a}"/>${letterSvg(L, on, letterSize(mark))}`;
    case "letra-arco":
      return `<path d="${ARCH}" fill="${a}"/>${letterSvg(L, on, letterSize(mark), 50, letterCenter(mark))}`;
    case "letra-sola":
      return `${letterSvg(L, a, letterSize(mark))}<circle cx="88" cy="86" r="9" fill="${b}"/>`;
    case "icono-duo":
      return `<circle cx="60" cy="60" r="38" fill="${b}"/>${iconSvg(opts.icon, a, 66, 13, 13, 2.4)}`;
    case "icono-squircle":
      return `<path d="${SQUIRCLE}" fill="${a}"/>${iconSvg(opts.icon, on, 54, 23, 23, 2.2)}`;
    default:
      return "";
  }
}
