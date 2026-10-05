// Kit de marca (identidad de marca) de un negocio: base (propuesta, personalidad, tono, eslogan)
// e identidad visual (isotipo, logotipo, paleta, degradado, tipografías).
// Los logos se arman con piezas curadas (diseño paramétrico): siempre legibles y en vector.

import { BRAND_ICONS } from "@/lib/brand-icons";
import { norm } from "@/lib/interview";
import { say, type AddressForm } from "@/lib/markets";

// ---------- Tipos ----------

export type Palette = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  light: string;
  tags: string[];
};

export type FontPair = {
  id: string;
  name: string;
  heading: { family: string; weight: number };
  body: { family: string; weight: number };
  mood: string;
};

export type Shape = "circle" | "rounded" | "hexagon" | "none";

export type BrandKit = {
  name: string; // nombre de la propuesta ("Fuerte y confiable")
  concept: string; // por qué funciona para este negocio
  proposition: string; // propuesta de valor
  personality: string[]; // 3 adjetivos
  tone: string; // tono de voz
  slogan: string;
  palette: string; // id de paleta
  fonts: string; // id de tipografías
  icon: string; // id de ícono (BRAND_ICONS)
  shape: Shape;
  monogram: boolean; // iniciales en lugar de ícono
};

// ---------- Paletas ----------

export const PALETTES: Palette[] = [
  { id: "obra-azul", name: "Obra confiable", primary: "#1F3A5F", secondary: "#F2A900", accent: "#E4572E", dark: "#14202E", light: "#F5F3EE", tags: ["ferreter", "construc", "taller", "mecan", "plomer", "electric", "mudanza"] },
  { id: "herramienta-roja", name: "Herramienta roja", primary: "#B91C1C", secondary: "#1F2937", accent: "#F59E0B", dark: "#111827", light: "#F8F5F0", tags: ["ferreter", "taller", "mecan", "fumiga"] },
  { id: "naranja-obra", name: "Naranja de obra", primary: "#C2410C", secondary: "#1E293B", accent: "#FACC15", dark: "#0F172A", light: "#FFF7ED", tags: ["ferreter", "construc", "mudanza"] },
  { id: "gris-industrial", name: "Gris industrial", primary: "#374151", secondary: "#9CA3AF", accent: "#F97316", dark: "#111827", light: "#F3F4F6", tags: ["taller", "mecan", "ferreter", "electric"] },
  { id: "verde-jardin", name: "Verde jardín", primary: "#2F6B3A", secondary: "#A3C93A", accent: "#F4B942", dark: "#1C2B1E", light: "#F3F6EC", tags: ["jardin", "vivero", "florister", "veterinar"] },
  { id: "verde-fresco", name: "Verde fresco", primary: "#047857", secondary: "#0EA5E9", accent: "#FBBF24", dark: "#064E3B", light: "#F0FDF4", tags: ["limpieza", "farmac", "lavander", "fumiga"] },
  { id: "azul-confianza", name: "Azul confianza", primary: "#1D4ED8", secondary: "#60A5FA", accent: "#F59E0B", dark: "#0F172A", light: "#F1F5F9", tags: ["clinica", "consultorio", "plomer", "limpieza", "electric", "papeler"] },
  { id: "turquesa-salud", name: "Turquesa salud", primary: "#0E7490", secondary: "#67E8F9", accent: "#F97316", dark: "#083344", light: "#ECFEFF", tags: ["farmac", "clinica", "veterinar", "consultorio"] },
  { id: "rosa-belleza", name: "Rosa belleza", primary: "#BE185D", secondary: "#F9A8D4", accent: "#D97706", dark: "#3B0A24", light: "#FDF2F8", tags: ["salon", "estetica", "belleza", "boutique", "reposter"] },
  { id: "lila-elegante", name: "Lila elegante", primary: "#6D28D9", secondary: "#C4B5FD", accent: "#D97706", dark: "#2E1065", light: "#FAF5FF", tags: ["salon", "estetica", "boutique", "ropa"] },
  { id: "negro-dorado", name: "Negro y dorado", primary: "#18181B", secondary: "#B8860B", accent: "#CA8A04", dark: "#0A0A0A", light: "#FAFAF9", tags: ["barber", "boutique", "joyer", "zapater", "ropa"] },
  { id: "terracota", name: "Terracota casero", primary: "#B45309", secondary: "#FDE68A", accent: "#B91C1C", dark: "#3F1D0B", light: "#FFFBEB", tags: ["panader", "reposter", "comedor", "fritanga"] },
  { id: "rojo-antojo", name: "Rojo antojo", primary: "#DC2626", secondary: "#FACC15", accent: "#15803D", dark: "#1F1300", light: "#FFFBEB", tags: ["restaurante", "fritanga", "taqueria", "comedor", "pizz"] },
  { id: "cafe-artesanal", name: "Café artesanal", primary: "#6F4E37", secondary: "#D4A373", accent: "#C2410C", dark: "#2B1D14", light: "#FAF3E8", tags: ["cafeter", "panader", "reposter"] },
  { id: "pulperia-alegre", name: "Tienda alegre", primary: "#2563EB", secondary: "#FACC15", accent: "#DC2626", dark: "#111827", light: "#FFFBEB", tags: ["pulper", "abarrot", "minisuper", "supermercado", "tienda", "bodega", "colmado"] },
  { id: "coral-moderno", name: "Coral moderno", primary: "#C9363A", secondary: "#247BA0", accent: "#FFB224", dark: "#1B1B1E", light: "#FFF8F0", tags: ["ropa", "tienda", "zapater", "libreria", "papeler"] },
];

// ---------- Tipografías (Google Fonts) ----------

export const FONT_PAIRS: FontPair[] = [
  { id: "solida", name: "Sólida", heading: { family: "Archivo Black", weight: 400 }, body: { family: "Archivo", weight: 400 }, mood: "fuerte y directa" },
  { id: "moderna", name: "Moderna", heading: { family: "Montserrat", weight: 700 }, body: { family: "Open Sans", weight: 400 }, mood: "moderna y profesional" },
  { id: "fuerte", name: "Fuerte", heading: { family: "Oswald", weight: 600 }, body: { family: "Source Sans 3", weight: 400 }, mood: "firme y compacta" },
  { id: "tecnica", name: "Técnica", heading: { family: "Barlow Condensed", weight: 700 }, body: { family: "Barlow", weight: 400 }, mood: "técnica y práctica" },
  { id: "amigable", name: "Amigable", heading: { family: "Fredoka", weight: 600 }, body: { family: "Nunito", weight: 400 }, mood: "cercana y alegre" },
  { id: "redonda", name: "Redonda", heading: { family: "Poppins", weight: 600 }, body: { family: "Poppins", weight: 400 }, mood: "limpia y amable" },
  { id: "fresca", name: "Fresca", heading: { family: "Rubik", weight: 600 }, body: { family: "Rubik", weight: 400 }, mood: "fresca y joven" },
  { id: "elegante", name: "Elegante", heading: { family: "Playfair Display", weight: 700 }, body: { family: "Lato", weight: 400 }, mood: "elegante y cuidada" },
  { id: "clasica", name: "Clásica", heading: { family: "DM Serif Display", weight: 400 }, body: { family: "DM Sans", weight: 400 }, mood: "clásica y confiable" },
  { id: "artesanal", name: "Artesanal", heading: { family: "Bitter", weight: 700 }, body: { family: "Work Sans", weight: 400 }, mood: "artesanal y honesta" },
];

// ---------- Íconos por giro ----------

const ICONS_BY_INDUSTRY: [string[], string[]][] = [
  [["ferreter"], ["hammer", "wrench", "paint-roller", "drill", "hard-hat", "ruler", "bolt"]],
  [["construc"], ["hard-hat", "construction", "house", "hammer", "ruler"]],
  [["pulper", "abarrot", "minisuper", "supermercado", "tienda", "bodega", "colmado"], ["store", "shopping-basket", "shopping-bag", "package", "apple", "milk"]],
  [["farmac"], ["pill", "heart-pulse", "cross", "stethoscope"]],
  [["clinica", "consultorio"], ["stethoscope", "heart-pulse", "cross"]],
  [["panader", "reposter"], ["croissant", "cake-slice", "wheat", "cookie"]],
  [["restaurante", "comedor", "fritanga", "taqueria"], ["utensils", "chef-hat", "soup", "flame", "beef", "fish"]],
  [["pizz"], ["pizza", "chef-hat", "flame"]],
  [["cafeter"], ["coffee", "croissant", "cookie"]],
  [["salon", "estetica", "belleza"], ["scissors", "sparkles", "brush", "flower-2", "gem"]],
  [["barber"], ["scissors", "sparkles", "brush"]],
  [["ropa", "boutique"], ["shirt", "shopping-bag", "gem", "ribbon"]],
  [["zapater"], ["footprints", "shopping-bag", "gem"]],
  [["taller", "mecan"], ["car", "wrench", "cog", "bike"]],
  [["jardin", "vivero"], ["leaf", "sprout", "tree-pine", "flower-2", "shovel"]],
  [["florister"], ["flower-2", "gift", "leaf", "heart"]],
  [["limpieza"], ["sparkles", "spray-can", "droplets", "house"]],
  [["lavander"], ["washing-machine", "shirt", "droplets", "sparkles"]],
  [["plomer"], ["droplets", "wrench", "shower-head"]],
  [["electric"], ["zap", "plug", "lightbulb"]],
  [["veterinar"], ["paw-print", "dog", "cat", "heart"]],
  [["librer", "papeler"], ["book-open", "pencil", "scroll-text"]],
  [["fumiga"], ["spray-can", "shield-check", "house"]],
  [["mudanza"], ["truck", "package", "house"]],
];
const GENERIC_ICONS = ["store", "star", "sparkles", "heart", "house", "gem"];

export function iconsFor(industry: string | null): string[] {
  const t = norm(industry ?? "");
  const hit = ICONS_BY_INDUSTRY.find(([keys]) => keys.some((k) => t.includes(k)));
  return [...(hit?.[1] ?? []), ...GENERIC_ICONS].filter((v, i, a) => a.indexOf(v) === i && BRAND_ICONS[v]);
}

export function palettesFor(industry: string | null): Palette[] {
  const t = norm(industry ?? "");
  const matching = PALETTES.filter((p) => p.tags.some((tag) => t.includes(tag)));
  return [...matching, ...PALETTES.filter((p) => !matching.includes(p))];
}

export const paletteById = (id: string) => PALETTES.find((p) => p.id === id) ?? PALETTES[0];
export const fontsById = (id: string) => FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[1];

// ---------- Color ----------

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
// Texto legible sobre un color: blanco o el oscuro de la paleta.
export function onColor(bg: string, dark = "#111111") {
  return contrast(bg, "#FFFFFF") >= contrast(bg, dark) ? "#FFFFFF" : dark;
}
export const rgbText = (hex: string) => rgb(hex).join(", ");

// CMYK aproximado (para la imprenta; el valor exacto lo ajusta el impresor).
export function cmykText(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return "0, 0, 0, 100";
  return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map((v) => Math.round(v * 100)).join(", ");
}

function mixHex(a: string, b: string, t: number) {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

// Final del degradado: el acento, oscurecido si es muy claro (encima va texto o logo en blanco).
export function gradientEnd(p: Palette) {
  for (const t of [0, 0.2, 0.35, 0.5]) {
    const c = mixHex(p.accent, p.dark, t);
    if (contrast(c, "#FFFFFF") >= 3) return c;
  }
  return p.dark;
}

export function gradientCss(p: Palette) {
  return `linear-gradient(135deg, ${p.primary} 0%, ${gradientEnd(p)} 100%)`;
}

// ---------- Tipografías ----------

export function googleFontsHref(pairs: FontPair[]) {
  const families = new Map<string, Set<number>>();
  for (const pair of pairs) {
    for (const f of [pair.heading, pair.body]) {
      if (!families.has(f.family)) families.set(f.family, new Set());
      families.get(f.family)!.add(f.weight);
    }
  }
  const query = [...families.entries()]
    .map(([family, weights]) => `family=${family.replace(/ /g, "+")}:wght@${[...weights].sort((a, b) => a - b).join(";")}`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

// ---------- Isotipo (SVG) ----------

export function initials(name: string) {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^\p{Lu}/u.test(w));
  return (words.slice(0, 2).map((w) => w[0]).join("") || name.slice(0, 2)).toUpperCase();
}

function shapePath(shape: Shape, size: number) {
  const s = size;
  if (shape === "circle") return `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}"/>`;
  if (shape === "rounded") return `<rect width="${s}" height="${s}" rx="${s * 0.24}"/>`;
  if (shape === "hexagon") {
    const r = s / 2;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${(r + r * Math.cos(a)).toFixed(2)},${(r + r * Math.sin(a)).toFixed(2)}`;
    }).join(" ");
    return `<polygon points="${pts}"/>`;
  }
  return "";
}

const escapeXml = (t: string) => t.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Isotipo como SVG completo. monogramText/monogramFont: para iniciales (el texto se dibuja con
// <text>; para descargas se reemplaza por trazos con lib/brand-render.ts).
export function isotypeSvg(
  kit: BrandKit,
  opts: { size?: number; mono?: string; monogramPath?: string; initials?: string } = {},
) {
  const size = opts.size ?? 100;
  const p = paletteById(kit.palette);
  const filled = kit.shape !== "none";
  const fill = opts.mono ?? p.primary;
  const ink = opts.mono ? "#FFFFFF" : filled ? onColor(p.primary, p.dark) : p.primary;
  const shape = filled ? `<g fill="${fill}">${shapePath(kit.shape, size)}</g>` : "";
  let mark: string;
  if (kit.monogram && opts.monogramPath) {
    mark = `<path d="${opts.monogramPath}" fill="${filled ? ink : fill}"/>`;
  } else if (kit.monogram) {
    mark = `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="${fontsById(kit.fonts).heading.family}" font-weight="${fontsById(kit.fonts).heading.weight}" font-size="${size * 0.42}" fill="${filled ? ink : fill}">${escapeXml(opts.initials ?? "")}</text>`;
  } else {
    const iconSize = filled ? size * 0.56 : size * 0.9;
    const offset = (size - iconSize) / 2;
    const color = filled ? ink : fill;
    mark = `<g transform="translate(${offset} ${offset}) scale(${iconSize / 24})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${BRAND_ICONS[kit.icon] ?? BRAND_ICONS.store}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${shape}${mark}</svg>`;
}

// ---------- Propuestas por reglas (sin IA o si la IA falla) ----------

type BusinessForKit = {
  name: string;
  industry: string | null;
  business_type: string | null;
  offers_delivery: boolean | null;
  payment_methods: string[];
  address_form: string | null;
  zone: string | null;
};

const SLOGANS: [string[], { tu: string; usted: string; vos: string }][] = [
  [["ferreter"], { tu: "Todo para tu obra, cerca de ti", usted: "Todo para su obra, cerca de usted", vos: "Todo para tu obra, cerca tuyo" }],
  [["pulper", "abarrot", "tienda", "minisuper", "bodega", "colmado"], { tu: "Lo de todos los días, a la vuelta de tu casa", usted: "Lo de todos los días, a la vuelta de su casa", vos: "Lo de todos los días, a la vuelta de tu casa" }],
  [["farmac"], { tu: "Cuidamos tu salud de cerca", usted: "Cuidamos su salud de cerca", vos: "Cuidamos tu salud de cerca" }],
  [["panader", "reposter"], { tu: "Recién horneado para ti", usted: "Recién horneado para usted", vos: "Recién horneado para vos" }],
  [["salon", "estetica", "belleza", "barber"], { tu: "Tu mejor versión empieza aquí", usted: "Su mejor versión empieza aquí", vos: "Tu mejor versión empieza aquí" }],
  [["taller", "mecan"], { tu: "Tu carro en buenas manos", usted: "Su carro en buenas manos", vos: "Tu carro en buenas manos" }],
  [["jardin"], { tu: "Tu jardín, siempre bonito", usted: "Su jardín, siempre bonito", vos: "Tu jardín, siempre bonito" }],
  [["restaurante", "comedor", "fritanga", "taqueria", "pizz"], { tu: "Sabor que te hace volver", usted: "Sabor que lo hace volver", vos: "Sabor que te hace volver" }],
];

function sloganFor(b: BusinessForKit) {
  const t = norm(b.industry ?? "");
  const hit = SLOGANS.find(([keys]) => keys.some((k) => t.includes(k)))?.[1];
  return say(b.address_form as AddressForm, hit ?? { tu: "Calidad y buen trato, siempre", usted: "Calidad y buen trato, siempre", vos: "Calidad y buen trato, siempre" });
}

export function rulesKits(b: BusinessForKit): BrandKit[] {
  const palettes = palettesFor(b.industry);
  const icons = iconsFor(b.industry);
  const extras = [
    b.offers_delivery ? "con entrega a domicilio" : null,
    b.payment_methods.some((m) => /fiado|cr[eé]dito/i.test(m)) ? "con crédito para clientes de confianza" : null,
  ].filter(Boolean);
  const proposition = `${b.industry ?? "Negocio"}${b.zone ? ` en ${b.zone}` : ""} con buen trato${extras.length ? `, ${extras.join(" y ")}` : ""}.`;
  const slogan = sloganFor(b);
  return [
    { name: "Fuerte y confiable", concept: "Colores sólidos y letra firme: transmite seriedad y que el cliente encuentra lo que busca.", personality: ["Confiable", "Práctico", "Cercano"], tone: "Claro y directo, con buen trato.", fonts: "solida", shape: "circle" as Shape, monogram: false },
    { name: "Moderno y profesional", concept: "Un estilo limpio que se ve bien en redes y en la página web.", personality: ["Profesional", "Moderno", "Atento"], tone: "Profesional pero cálido.", fonts: "moderna", shape: "rounded" as Shape, monogram: false },
    { name: "Cercano y de barrio", concept: "Letra amable y colores alegres: el negocio de confianza de la zona.", personality: ["Amable", "Alegre", "De confianza"], tone: "Cercano, como un vecino.", fonts: "amigable", shape: "hexagon" as Shape, monogram: true },
  ].map((d, i) => ({
    ...d,
    proposition,
    slogan,
    palette: palettes[i % palettes.length].id,
    icon: icons[i % icons.length],
  }));
}

// Corrige una propuesta que venga de la IA: solo valores de las colecciones curadas.
export function sanitizeKit(k: Partial<BrandKit>, fallback: BrandKit): BrandKit {
  const str = (v: unknown, max: number, def: string) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : def);
  return {
    name: str(k.name, 60, fallback.name),
    concept: str(k.concept, 300, fallback.concept),
    proposition: str(k.proposition, 240, fallback.proposition),
    personality: Array.isArray(k.personality) && k.personality.length
      ? k.personality.slice(0, 3).map((p) => String(p).slice(0, 30))
      : fallback.personality,
    tone: str(k.tone, 160, fallback.tone),
    slogan: str(k.slogan, 90, fallback.slogan),
    palette: PALETTES.some((p) => p.id === k.palette) ? k.palette! : fallback.palette,
    fonts: FONT_PAIRS.some((f) => f.id === k.fonts) ? k.fonts! : fallback.fonts,
    icon: k.icon && BRAND_ICONS[k.icon] ? k.icon : fallback.icon,
    shape: (["circle", "rounded", "hexagon", "none"] as Shape[]).includes(k.shape as Shape) ? (k.shape as Shape) : fallback.shape,
    monogram: typeof k.monogram === "boolean" ? k.monogram : fallback.monogram,
  };
}

// Kit guardado en la base de datos (businesses.brand_kit / brand_options), siempre saneado.
export function storedKit(json: unknown, b: BusinessForKit): BrandKit | null {
  if (!json || typeof json !== "object" || Array.isArray(json)) return null;
  return sanitizeKit(json as Partial<BrandKit>, rulesKits(b)[0]);
}

export function storedOptions(json: unknown, b: BusinessForKit): BrandKit[] {
  if (!Array.isArray(json)) return [];
  const fallback = rulesKits(b);
  return json.slice(0, 3).map((k, i) => sanitizeKit((k ?? {}) as Partial<BrandKit>, fallback[i] ?? fallback[0]));
}

export const SHAPES: { id: Shape; label: string }[] = [
  { id: "circle", label: "Círculo" },
  { id: "rounded", label: "Cuadro redondeado" },
  { id: "hexagon", label: "Hexágono" },
  { id: "none", label: "Sin fondo" },
];
