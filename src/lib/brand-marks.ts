// Símbolos modernos para los logos: símbolos con concepto del giro (tuerca, grano de café, gota…),
// formas geométricas simples (estilo Bauhaus / suizo), letras protagonistas y un ícono a dos tonos.
// Todo se dibuja en un cuadro de 100 × 100.
// Sirve en el navegador y en el servidor (la letra en el servidor llega ya convertida en trazos).

import { BRAND_ICONS } from "@/lib/brand-icons";

export type ConceptMark =
  | "tuerca"
  | "engrane"
  | "techo"
  | "grano"
  | "trigo"
  | "hoja"
  | "gota"
  | "cruz"
  | "capsula"
  | "tijera"
  | "huella"
  | "toldo"
  | "bolsa"
  | "tazon"
  | "rayo"
  | "flecha"
  | "gema"
  | "corona"
  | "chispa"
  | "llave";

export type MarkId =
  | ConceptMark
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

export type MarkInfo = { id: Exclude<MarkId, "clasico">; label: string; kind: "concepto" | "forma" | "letra" | "icono"; tags?: string[] };

export const MARKS: MarkInfo[] = [
  { id: "tuerca", label: "Tuerca", kind: "concepto", tags: ["ferreter", "taller", "mecan", "construc", "industri", "soldad"] },
  { id: "engrane", label: "Engranaje", kind: "concepto", tags: ["taller", "mecan", "industri", "ferreter", "tecnolog", "reparac"] },
  { id: "techo", label: "Casa", kind: "concepto", tags: ["construc", "ferreter", "inmobil", "bienes", "hogar", "limpieza", "muebl", "pintur"] },
  { id: "llave", label: "Llave", kind: "concepto", tags: ["cerrajer", "inmobil", "bienes", "hogar", "seguridad", "ferreter"] },
  { id: "grano", label: "Grano de café", kind: "concepto", tags: ["cafeter", "cafe", "tostad"] },
  { id: "trigo", label: "Espiga", kind: "concepto", tags: ["panader", "reposter", "pulper", "abarrot", "comedor"] },
  { id: "tazon", label: "Tazón humeante", kind: "concepto", tags: ["restaurante", "comedor", "fritanga", "sopa", "cocina", "taqueria", "cafeter"] },
  { id: "hoja", label: "Hoja", kind: "concepto", tags: ["jardin", "vivero", "verdur", "frut", "natural", "organic", "spa", "mercado"] },
  { id: "gota", label: "Gota", kind: "concepto", tags: ["limpieza", "lavander", "plomer", "agua", "piscin", "fumiga"] },
  { id: "cruz", label: "Cruz de salud", kind: "concepto", tags: ["farmac", "clinica", "consultorio", "salud", "medic", "veterinar"] },
  { id: "capsula", label: "Cápsula", kind: "concepto", tags: ["farmac", "botica", "salud"] },
  { id: "tijera", label: "Tijera", kind: "concepto", tags: ["salon", "barber", "estetica", "belleza", "costur", "sastre"] },
  { id: "huella", label: "Huella", kind: "concepto", tags: ["veterinar", "mascota", "pet", "agropec"] },
  { id: "toldo", label: "Tiendita", kind: "concepto", tags: ["pulper", "abarrot", "tienda", "minisuper", "bodega", "colmado", "mercado"] },
  { id: "bolsa", label: "Bolsa de compras", kind: "concepto", tags: ["tienda", "ropa", "boutique", "zapater", "minisuper", "regalo", "variedad"] },
  { id: "rayo", label: "Rayo", kind: "concepto", tags: ["electric", "tecnolog", "celular", "computa", "energia", "gimnas"] },
  { id: "flecha", label: "Flecha rápida", kind: "concepto", tags: ["envio", "mudanza", "transporte", "mensajer", "delivery", "logistic"] },
  { id: "gema", label: "Gema", kind: "concepto", tags: ["joyer", "boutique", "belleza", "lujo", "relojer"] },
  { id: "corona", label: "Corona", kind: "concepto", tags: ["barber", "salon", "belleza", "boutique", "premium"] },
  { id: "chispa", label: "Destello", kind: "concepto", tags: ["limpieza", "estetica", "belleza", "lavander", "fotograf", "diseño"] },
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

// Polígono regular (para la tuerca) y engranaje.
const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
};
const circlePath = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;
function gearPath() {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = i * 45;
    pts.push(polar(50, 50, 34, a - 17), polar(50, 50, 46, a - 9), polar(50, 50, 46, a + 9), polar(50, 50, 34, a + 17));
  }
  return `M${pts.join("L")}Z${circlePath(50, 50, 14)}`;
}
const star4 = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}C${cx + r * 0.08} ${cy - r * 0.32} ${cx + r * 0.24} ${cy - r * 0.08} ${cx + r} ${cy}C${cx + r * 0.24} ${cy + r * 0.08} ${cx + r * 0.08} ${cy + r * 0.24} ${cx} ${cy + r}C${cx - r * 0.08} ${cy + r * 0.24} ${cx - r * 0.24} ${cy + r * 0.08} ${cx - r} ${cy}C${cx - r * 0.24} ${cy - r * 0.08} ${cx - r * 0.08} ${cy - r * 0.32} ${cx} ${cy - r}Z`;

function conceptMark(mark: ConceptMark, { a, b, on }: MarkColors) {
  switch (mark) {
    case "tuerca":
      return `<path fill-rule="evenodd" d="M${[0, 60, 120, 180, 240, 300].map((d) => polar(50, 50, 47, d)).join("L")}Z${circlePath(50, 50, 18)}" fill="${a}"/><circle cx="50" cy="50" r="7" fill="${b}"/>`;
    case "engrane":
      return `<path fill-rule="evenodd" d="${gearPath()}" fill="${a}"/><circle cx="50" cy="50" r="6" fill="${b}"/>`;
    case "techo":
      return `<path d="M6 50L50 10L94 50L82 50L50 22L18 50Z" fill="${a}"/><rect x="24" y="52" width="52" height="40" rx="5" fill="${a}"/><rect x="42" y="66" width="16" height="26" rx="3" fill="${b}"/>`;
    case "llave":
      return `<path fill-rule="evenodd" d="${circlePath(30, 50, 24)}${circlePath(30, 50, 11)}" fill="${a}"/><rect x="50" y="44" width="46" height="12" rx="4" fill="${a}"/><rect x="72" y="54" width="9" height="16" rx="2" fill="${a}"/><rect x="86" y="54" width="9" height="11" rx="2" fill="${a}"/><circle cx="30" cy="50" r="5" fill="${b}"/>`;
    case "grano":
      return `<g transform="rotate(-28 50 50)"><ellipse cx="50" cy="50" rx="30" ry="44" fill="${a}"/><path d="M50 8C38 26 62 44 50 50C38 56 62 74 50 92" fill="none" stroke="${on}" stroke-width="6" stroke-linecap="round"/></g>`;
    case "trigo": {
      const leaf = (y: number, side: 1 | -1, color: string) => `<ellipse cx="${50 + side * 11}" cy="${y}" rx="8" ry="15" transform="rotate(${side * 32} ${50 + side * 11} ${y})" fill="${color}"/>`;
      return `<rect x="47.5" y="22" width="5" height="74" rx="2.5" fill="${a}"/>${[34, 52, 70].map((y) => leaf(y, -1, a) + leaf(y, 1, a)).join("")}<ellipse cx="50" cy="16" rx="8" ry="14" fill="${b}"/>`;
    }
    case "tazon":
      return `<path d="M6 48H94A44 44 0 0 1 6 48Z" fill="${a}"/><rect x="32" y="88" width="36" height="8" rx="4" fill="${a}"/><g fill="none" stroke="${b}" stroke-width="6" stroke-linecap="round"><path d="M32 38C26 30 38 24 32 14"/><path d="M50 38C44 30 56 24 50 14"/><path d="M68 38C62 30 74 24 68 14"/></g>`;
    case "hoja":
      return `<path d="M50 4C84 24 90 70 50 96C10 70 16 24 50 4Z" fill="${a}"/><path d="M50 22V84M50 46L66 34M50 62L34 50" fill="none" stroke="${on}" stroke-width="5" stroke-linecap="round"/>`;
    case "gota":
      return `<path d="M44 6C44 6 78 42 78 62A34 34 0 0 1 10 62C10 42 44 6 44 6Z" fill="${a}"/><path d="M26 64A18 18 0 0 0 40 80" fill="none" stroke="${on}" stroke-width="6" stroke-linecap="round"/><path d="${star4(82, 20, 14)}" fill="${b}"/>`;
    case "cruz":
      return `<rect x="34" y="6" width="32" height="88" rx="12" fill="${a}"/><rect x="6" y="34" width="88" height="32" rx="12" fill="${a}"/><circle cx="50" cy="50" r="9" fill="${b}"/>`;
    case "capsula":
      return `<g transform="rotate(45 50 50)"><path d="M32 50V27A18 18 0 0 1 68 27V50Z" fill="${a}"/><path d="M32 50V73A18 18 0 0 0 68 73V50Z" fill="${b}"/></g>`;
    case "tijera":
      return `<g fill="none" stroke="${a}" stroke-width="8" stroke-linecap="round"><circle cx="28" cy="74" r="14"/><circle cx="72" cy="74" r="14"/><path d="M36 62L80 8M64 62L20 8"/></g><circle cx="50" cy="40" r="6" fill="${b}"/>`;
    case "huella":
      return `<ellipse cx="50" cy="66" rx="22" ry="19" fill="${a}"/><circle cx="22" cy="40" r="10" fill="${a}"/><circle cx="38" cy="22" r="10" fill="${a}"/><circle cx="62" cy="22" r="10" fill="${b}"/><circle cx="78" cy="40" r="10" fill="${a}"/>`;
    case "toldo": {
      const scallops = [0, 1, 2, 3].map((i) => `<path d="M${10 + i * 20} 24H${30 + i * 20}V36A10 10 0 0 1 ${10 + i * 20} 36Z" fill="${i % 2 ? b : a}"/>`).join("");
      return `<rect x="8" y="10" width="84" height="16" rx="6" fill="${a}"/>${scallops}<path d="M16 50V90H84V50" fill="none" stroke="${a}" stroke-width="7" stroke-linejoin="round"/><rect x="42" y="62" width="16" height="28" rx="3" fill="${a}"/>`;
    }
    case "bolsa":
      return `<path d="M36 34V26A14 14 0 0 1 64 26V34" fill="none" stroke="${a}" stroke-width="7" stroke-linecap="round"/><path d="M16 34H84L80 86Q79 94 71 94H29Q21 94 20 86Z" fill="${a}"/><circle cx="50" cy="62" r="9" fill="${b}"/>`;
    case "rayo":
      return `<path d="M58 4L18 56H46L38 96L82 40H54Z" fill="${a}"/><circle cx="84" cy="80" r="8" fill="${b}"/>`;
    case "flecha":
      return `<path d="M30 50H82M62 28L84 50L62 72" fill="none" stroke="${a}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><g stroke="${b}" stroke-width="7" stroke-linecap="round"><path d="M8 34H26"/><path d="M4 50H16"/><path d="M8 66H26"/></g>`;
    case "gema":
      return `<path d="M24 12H76L96 38L50 92L4 38Z" fill="${a}"/><path d="M4 38H96M24 12L38 38L50 92M76 12L62 38L50 92M38 38L50 12L62 38" fill="none" stroke="${on}" stroke-width="3" stroke-linejoin="round"/>`;
    case "corona":
      return `<path d="M8 76L14 26L34 48L50 16L66 48L86 26L92 76Z" fill="${a}"/><rect x="8" y="82" width="84" height="12" rx="4" fill="${b}"/>`;
    case "chispa":
      return `<path d="${star4(44, 54, 42)}" fill="${a}"/><path d="${star4(84, 16, 13)}" fill="${b}"/>`;
  }
}

export const isConceptMark = (m: MarkId): m is ConceptMark => MARKS.some((x) => x.id === m && x.kind === "concepto");

// Símbolos que mejor van con el giro del negocio (primero los de concepto, luego letras y formas).
export function marksFor(industry: string | null): MarkInfo[] {
  const t = (industry ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const hits = MARKS.filter((m) => m.kind === "concepto" && m.tags?.some((tag) => t.includes(tag)));
  const rest = MARKS.filter((m) => m.kind !== "concepto");
  return [...hits, ...rest, ...MARKS.filter((m) => m.kind === "concepto" && !hits.includes(m))];
}

// SVG interno del símbolo (sin la etiqueta <svg>) en un cuadro de 100 × 100.
export function modernMark(mark: MarkId, colors: MarkColors, opts: { icon: string; letter: MarkLetter }) {
  const { a, b, c, on } = colors;
  const L = opts.letter;
  if (isConceptMark(mark)) return conceptMark(mark, colors);
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
