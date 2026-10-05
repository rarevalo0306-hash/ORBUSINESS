// Kit de marca (identidad de marca) de un negocio: base (historia, misión, valores, voz, textos)
// e identidad visual (logo en varios estilos, isotipo, paleta, degradado, tipografías y patrón).
// Los logos se arman con piezas curadas (diseño paramétrico): siempre legibles, en vector y sin
// problemas de derechos. La IA elige y combina las piezas e inventa colores y textos a la medida.

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
export type Colors = Pick<Palette, "primary" | "secondary" | "accent" | "dark" | "light">;

export type FontPair = {
  id: string;
  name: string;
  heading: { family: string; weight: number };
  body: { family: string; weight: number };
  mood: string;
  script?: boolean; // letra cursiva: no se escribe en mayúsculas
};

export type Shape = "circle" | "rounded" | "hexagon" | "shield" | "diamond" | "ring" | "none";
export type Layout = "clasico" | "apilado" | "emblema" | "palabra";
export type NameStyle = "normal" | "mayusculas" | "dos-tonos";
export type Pattern = "iconos" | "puntos" | "diagonales" | "ondas" | "cruces";

export type BrandBase = {
  story: string; // historia de la marca
  mission: string;
  vision: string;
  values: { name: string; text: string }[];
  audience: string; // cliente ideal
  promise: string; // promesa de marca
  messages: string[]; // mensajes clave
  voiceDo: string[]; // así sí hablamos
  voiceDont: string[]; // así no hablamos
  bio: string; // bio de Instagram / Facebook
  description: string; // descripción para Google y WhatsApp Business
  whatsappWelcome: string; // mensaje de bienvenida de WhatsApp
  hashtags: string[];
  postIdeas: string[]; // ideas de publicaciones
  photoStyle: string; // cómo deben ser las fotos
};

export type BrandKit = {
  name: string; // nombre de la propuesta ("Fuerte y confiable")
  concept: string; // la idea creativa y por qué funciona
  proposition: string; // propuesta de valor
  personality: string[]; // 3 adjetivos
  tone: string; // tono de voz
  slogan: string;
  caption: string; // texto pequeño del logo (giro · zona)
  palette: string; // id de paleta curada, o "custom" si usa colors
  colors?: Colors | null; // paleta inventada para este negocio (ya corregida para que se lea bien)
  fonts: string; // id de tipografías
  icon: string; // id de ícono (BRAND_ICONS)
  shape: Shape;
  monogram: boolean; // iniciales en lugar de ícono
  layout: Layout;
  nameStyle: NameStyle;
  pattern: Pattern;
  base?: BrandBase | null;
};

// ---------- Paletas curadas ----------

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

// ---------- Tipografías (Google Fonts, licencia libre) ----------

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
  { id: "cartel", name: "Cartel", heading: { family: "Bebas Neue", weight: 400 }, body: { family: "Inter", weight: 400 }, mood: "alta, de cartel, llama la atención" },
  { id: "tropical", name: "Tropical", heading: { family: "Pacifico", weight: 400 }, body: { family: "Nunito", weight: 400 }, mood: "escrita a mano, alegre y tropical", script: true },
  { id: "retro", name: "Retro", heading: { family: "Righteous", weight: 400 }, body: { family: "Rubik", weight: 400 }, mood: "retro y divertida" },
  { id: "revista", name: "Revista", heading: { family: "Abril Fatface", weight: 400 }, body: { family: "Lato", weight: 400 }, mood: "de revista, llamativa y con estilo" },
  { id: "dulce", name: "Dulce", heading: { family: "Baloo 2", weight: 700 }, body: { family: "Nunito", weight: 400 }, mood: "suave, dulce y cercana" },
  { id: "digital", name: "Digital", heading: { family: "Space Grotesk", weight: 700 }, body: { family: "Inter", weight: 400 }, mood: "tecnológica y actual" },
  { id: "rotulo", name: "Rótulo", heading: { family: "Lobster", weight: 400 }, body: { family: "Open Sans", weight: 400 }, mood: "de rótulo clásico pintado a mano", script: true },
  { id: "lujo", name: "Lujo", heading: { family: "Cinzel", weight: 700 }, body: { family: "Raleway", weight: 400 }, mood: "de lujo, señorial" },
  { id: "urbana", name: "Urbana", heading: { family: "Anton", weight: 400 }, body: { family: "Roboto", weight: 400 }, mood: "urbana y potente" },
  { id: "ligera", name: "Ligera", heading: { family: "Comfortaa", weight: 700 }, body: { family: "Nunito", weight: 400 }, mood: "ligera y redondeada" },
  { id: "vanguardia", name: "Vanguardia", heading: { family: "Syne", weight: 700 }, body: { family: "Manrope", weight: 400 }, mood: "creativa y de vanguardia" },
  { id: "taller", name: "Taller", heading: { family: "Alfa Slab One", weight: 400 }, body: { family: "Karla", weight: 400 }, mood: "de taller, robusta y con carácter" },
  { id: "callejera", name: "Callejera", heading: { family: "Permanent Marker", weight: 400 }, body: { family: "Karla", weight: 400 }, mood: "hecha a mano, callejera y auténtica", script: true },
  { id: "geometrica", name: "Geométrica", heading: { family: "Outfit", weight: 700 }, body: { family: "Outfit", weight: 400 }, mood: "geométrica y limpia" },
  { id: "gordita", name: "Gordita", heading: { family: "Lilita One", weight: 400 }, body: { family: "Nunito", weight: 400 }, mood: "gruesa, simpática y popular" },
];

// ---------- Opciones de diseño ----------

export const SHAPES: { id: Shape; label: string }[] = [
  { id: "circle", label: "Círculo" },
  { id: "rounded", label: "Cuadro redondeado" },
  { id: "hexagon", label: "Hexágono" },
  { id: "shield", label: "Escudo" },
  { id: "diamond", label: "Rombo" },
  { id: "ring", label: "Aro" },
  { id: "none", label: "Sin fondo" },
];

export const LAYOUTS: { id: Layout; label: string; note: string }[] = [
  { id: "clasico", label: "Clásico", note: "Símbolo y nombre en línea" },
  { id: "apilado", label: "Apilado", note: "Nombre en dos líneas y texto pequeño" },
  { id: "emblema", label: "Emblema", note: "Sello redondo con el nombre alrededor" },
  { id: "palabra", label: "Solo nombre", note: "El nombre es el logo, con un detalle de color" },
];

export const NAME_STYLES: { id: NameStyle; label: string }[] = [
  { id: "normal", label: "Normal" },
  { id: "mayusculas", label: "MAYÚSCULAS" },
  { id: "dos-tonos", label: "Dos colores" },
];

export const PATTERNS: { id: Pattern; label: string }[] = [
  { id: "iconos", label: "Con tu símbolo" },
  { id: "puntos", label: "Puntos" },
  { id: "diagonales", label: "Rayas" },
  { id: "ondas", label: "Ondas" },
  { id: "cruces", label: "Cruces" },
];

// ---------- Íconos por giro ----------

const ICONS_BY_INDUSTRY: [string[], string[]][] = [
  [["ferreter"], ["hammer", "wrench", "paint-roller", "drill", "hard-hat", "ruler", "bolt", "nut", "toolbox", "axe", "paint-bucket", "brick-wall", "pickaxe"]],
  [["construc"], ["hard-hat", "construction", "brick-wall", "house", "hammer", "ruler", "drafting-compass", "building-2"]],
  [["pulper", "abarrot", "minisuper", "supermercado", "tienda", "bodega", "colmado"], ["store", "shopping-basket", "shopping-bag", "package", "apple", "milk", "egg", "carrot", "banana", "tag", "coins"]],
  [["farmac"], ["pill", "tablets", "heart-pulse", "cross", "stethoscope", "syringe", "thermometer", "hand-heart"]],
  [["clinica", "consultorio"], ["stethoscope", "heart-pulse", "cross", "activity", "hospital", "hand-heart"]],
  [["panader", "reposter"], ["croissant", "cake-slice", "cake", "wheat", "cookie", "donut"]],
  [["restaurante", "comedor", "fritanga", "taqueria"], ["utensils", "utensils-crossed", "chef-hat", "cooking-pot", "soup", "flame", "beef", "drumstick", "fish", "salad"]],
  [["pizz"], ["pizza", "chef-hat", "flame", "cooking-pot"]],
  [["cafeter"], ["coffee", "croissant", "cookie", "donut", "cup-soda"]],
  [["bar", "cantina"], ["beer", "wine", "martini", "music"]],
  [["salon", "estetica", "belleza"], ["scissors", "sparkles", "brush", "flower-2", "gem", "crown", "flower", "sparkle"]],
  [["barber"], ["scissors", "sparkles", "brush", "crown"]],
  [["ropa", "boutique"], ["shirt", "shopping-bag", "gem", "ribbon", "tag", "crown"]],
  [["zapater"], ["footprints", "shopping-bag", "gem", "tag"]],
  [["taller", "mecan"], ["car", "car-front", "wrench", "cog", "bike", "fuel", "nut"]],
  [["jardin", "vivero"], ["leaf", "sprout", "tree-pine", "trees", "flower-2", "shovel", "palmtree", "leafy-green"]],
  [["florister"], ["flower-2", "flower", "gift", "leaf", "heart"]],
  [["limpieza"], ["sparkles", "spray-can", "droplets", "house", "sparkle"]],
  [["lavander"], ["washing-machine", "shirt", "droplets", "sparkles"]],
  [["plomer"], ["droplets", "wrench", "shower-head", "waves"]],
  [["electric"], ["zap", "plug", "lightbulb", "bolt"]],
  [["veterinar", "mascota"], ["paw-print", "dog", "cat", "bone", "heart"]],
  [["librer", "papeler"], ["book-open", "pencil", "scroll-text", "pen-tool", "graduation-cap", "printer"]],
  [["fumiga"], ["spray-can", "bug", "shield-check", "house"]],
  [["mudanza", "transporte", "envio"], ["truck", "package", "house", "forklift", "map-pin"]],
  [["gimnas", "deporte"], ["dumbbell", "trophy", "medal", "activity", "bike"]],
  [["fotograf"], ["camera", "sparkles", "palette"]],
  [["optic"], ["glasses", "sparkles"]],
  [["joyer", "relojer"], ["gem", "watch", "crown", "sparkle"]],
  [["frut", "verdur", "mercado"], ["apple", "carrot", "banana", "cherry", "grape", "citrus", "leafy-green", "shopping-basket"]],
  [["conta", "abogad", "asesor", "seguro"], ["briefcase", "calculator", "handshake", "shield-check", "scroll-text"]],
  [["escuela", "colegio", "tutor"], ["school", "graduation-cap", "book-open", "pencil", "blocks"]],
  [["juguet"], ["puzzle", "blocks", "gamepad-2", "baby"]],
  [["celular", "computa", "tecnolog"], ["smartphone", "laptop", "zap", "plug"]],
];
const GENERIC_ICONS = ["store", "star", "sparkles", "heart", "house", "gem", "handshake", "map-pin", "sun", "crown"];

export function iconsFor(industry: string | null): string[] {
  const t = norm(industry ?? "");
  const hit = ICONS_BY_INDUSTRY.filter(([keys]) => keys.some((k) => t.includes(k))).flatMap(([, icons]) => icons);
  return [...hit, ...GENERIC_ICONS].filter((v, i, a) => a.indexOf(v) === i && BRAND_ICONS[v]);
}

export function palettesFor(industry: string | null): Palette[] {
  const t = norm(industry ?? "");
  const matching = PALETTES.filter((p) => p.tags.some((tag) => t.includes(tag)));
  return [...matching, ...PALETTES.filter((p) => !matching.includes(p))];
}

export const paletteById = (id: string) => PALETTES.find((p) => p.id === id) ?? PALETTES[0];
export const fontsById = (id: string) => FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[1];

// Paleta del kit: la inventada para el negocio o una curada.
export function kitPalette(kit: Pick<BrandKit, "palette" | "colors">): Palette {
  if (kit.colors) return { id: "custom", name: "Hecha a tu medida", ...kit.colors, tags: [] };
  return paletteById(kit.palette);
}

// ---------- Color ----------

const HEX = /^#[0-9a-f]{6}$/i;

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

export function mixHex(a: string, b: string, t: number) {
  const [x, y] = [rgb(a), rgb(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

// Oscurece un color sin cambiarle el tono (baja la luminosidad en HSL).
function darken(hex: string, amount: number) {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  l = Math.max(0, l - amount);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return `#${[r1, g1, b1].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

// Corrige una paleta inventada (por la IA) para que siempre se lea bien.
export function fixColors(c: Partial<Colors> | null | undefined): Colors | null {
  if (!c || ![c.primary, c.secondary, c.accent, c.dark, c.light].every((v) => typeof v === "string" && HEX.test(v))) return null;
  const src = c as Colors;
  let { primary, dark, light } = src;
  for (let t = 0.15; luminance(light) < 0.82 && t <= 1; t += 0.15) light = mixHex(src.light, "#FFFFFF", t);
  for (let t = 0.2; contrast(dark, light) < 10 && t <= 1; t += 0.2) dark = mixHex(src.dark, "#000000", t);
  for (let t = 0.03; (contrast(primary, light) < 4.5 || contrast(primary, "#FFFFFF") < 4.5) && t <= 1; t += 0.03) {
    primary = darken(src.primary, t);
  }
  return {
    primary: primary.toUpperCase(),
    secondary: src.secondary.toUpperCase(),
    accent: src.accent.toUpperCase(),
    dark: dark.toUpperCase(),
    light: light.toUpperCase(),
  };
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

// Nombre como se escribe en el logo.
export function logoName(kit: Pick<BrandKit, "nameStyle" | "fonts">, name: string) {
  return kit.nameStyle === "mayusculas" && !fontsById(kit.fonts).script ? name.toLocaleUpperCase("es") : name;
}

// Nombre en dos partes (para el nombre a dos colores y el logo apilado):
// "Ferretería Arévalo" → ["Ferretería", "Arévalo"]; "La Casa del Pan" → ["La Casa", "del Pan"].
export function splitName(name: string): [string, string] {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return [name.trim(), ""];
  const cut = Math.ceil(words.length / 2);
  return [words.slice(0, cut).join(" "), words.slice(cut).join(" ")];
}

// ---------- Isotipo (SVG) ----------

export function initials(name: string) {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^\p{Lu}/u.test(w));
  return (words.slice(0, 2).map((w) => w[0]).join("") || name.slice(0, 2)).toUpperCase();
}

export const escapeXml = (t: string) => t.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Forma de fondo del isotipo, dibujada en un cuadro de size × size.
export function shapeSvg(shape: Shape, size: number, fill: string) {
  const s = size;
  if (shape === "circle") return `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="${fill}"/>`;
  if (shape === "rounded") return `<rect width="${s}" height="${s}" rx="${s * 0.24}" fill="${fill}"/>`;
  if (shape === "ring") {
    const w = s * 0.07;
    return `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - w / 2}" fill="none" stroke="${fill}" stroke-width="${w}"/>`;
  }
  if (shape === "diamond") {
    return `<rect x="${s * 0.146}" y="${s * 0.146}" width="${s * 0.708}" height="${s * 0.708}" rx="${s * 0.06}" transform="rotate(45 ${s / 2} ${s / 2})" fill="${fill}"/>`;
  }
  if (shape === "shield") {
    return `<path d="M${s / 2} 0 L${s * 0.94} ${s * 0.14} V${s * 0.5} C${s * 0.94} ${s * 0.76} ${s * 0.74} ${s * 0.91} ${s / 2} ${s} C${s * 0.26} ${s * 0.91} ${s * 0.06} ${s * 0.76} ${s * 0.06} ${s * 0.5} V${s * 0.14} Z" fill="${fill}"/>`;
  }
  if (shape === "hexagon") {
    const r = s / 2;
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${(r + r * Math.cos(a)).toFixed(2)},${(r + r * Math.sin(a)).toFixed(2)}`;
    }).join(" ");
    return `<polygon points="${pts}" fill="${fill}"/>`;
  }
  return "";
}

// Tamaño del símbolo dentro de cada forma (proporción del cuadro).
export const markScale = (shape: Shape) =>
  shape === "none" ? 0.9 : shape === "diamond" ? 0.44 : shape === "shield" || shape === "ring" ? 0.5 : 0.56;

// Solo el símbolo (ícono o iniciales), centrado en un cuadro de size × size.
export function markSvg(
  kit: Pick<BrandKit, "icon" | "monogram" | "fonts">,
  size: number,
  color: string,
  opts: { monogramPath?: string; initials?: string; scale?: number } = {},
) {
  const scale = opts.scale ?? 0.56;
  if (kit.monogram && opts.monogramPath) return `<path d="${opts.monogramPath}" fill="${color}"/>`;
  if (kit.monogram) {
    const f = fontsById(kit.fonts).heading;
    return `<text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central" font-family="${f.family}" font-weight="${f.weight}" font-size="${size * 0.75 * scale}" fill="${color}">${escapeXml(opts.initials ?? "")}</text>`;
  }
  const iconSize = size * scale;
  const offset = (size - iconSize) / 2;
  return `<g transform="translate(${offset} ${offset}) scale(${iconSize / 24})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${BRAND_ICONS[kit.icon] ?? BRAND_ICONS.store}</g>`;
}

// Isotipo como SVG completo. Para iniciales en pantalla usa <text>; en descargas, trazos (brand-render).
// mono: dibuja todo en un solo color (blanco para fondos oscuros, oscuro para sellos).
export function isotypeSvg(
  kit: BrandKit,
  opts: { size?: number; mono?: string; monogramPath?: string; initials?: string } = {},
) {
  const size = opts.size ?? 100;
  const p = kitPalette(kit);
  const filled = kit.shape !== "none" && kit.shape !== "ring";
  const fill = opts.mono ?? p.primary;
  // Símbolo sobre la forma: el color que se lee sobre ella (con mono blanco, el principal "calado").
  const ink = !filled ? fill : opts.mono ? (opts.mono === "#FFFFFF" ? p.primary : "#FFFFFF") : onColor(p.primary, p.dark);
  const mark = markSvg(kit, size, ink, { monogramPath: opts.monogramPath, initials: opts.initials, scale: markScale(kit.shape) });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${shapeSvg(kit.shape, size, fill)}${mark}</svg>`;
}

// ---------- Patrón de marca ----------

// Mosaico de tile × tile que se repite sin cortes. color = color del dibujo.
export function patternTile(kit: Pick<BrandKit, "pattern" | "icon" | "fonts">, tile: number, color: string) {
  const t = tile;
  const q = t / 4;
  switch (kit.pattern) {
    case "puntos":
      return `<circle cx="${q}" cy="${q}" r="${t * 0.05}" fill="${color}"/><circle cx="${3 * q}" cy="${3 * q}" r="${t * 0.05}" fill="${color}"/>`;
    case "diagonales":
      return `<g stroke="${color}" stroke-width="${t * 0.1}"><line x1="${-q}" y1="${q}" x2="${q}" y2="${-q}"/><line x1="0" y1="${t}" x2="${t}" y2="0"/><line x1="${3 * q}" y1="${t + q}" x2="${t + q}" y2="${3 * q}"/></g>`;
    case "ondas":
      return `<g fill="none" stroke="${color}" stroke-width="${t * 0.05}" stroke-linecap="round"><path d="M0 ${q} Q${q} 0 ${2 * q} ${q} T${t} ${q}"/><path d="M0 ${3 * q} Q${q} ${2 * q} ${2 * q} ${3 * q} T${t} ${3 * q}"/></g>`;
    case "cruces": {
      const a = t * 0.07;
      const cross = (x: number, y: number) => `<path d="M${x - a} ${y}H${x + a}M${x} ${y - a}V${y + a}"/>`;
      return `<g stroke="${color}" stroke-width="${t * 0.035}" stroke-linecap="round">${cross(q, q)}${cross(3 * q, 3 * q)}</g>`;
    }
    default: {
      const s = t * 0.32;
      const icon = (x: number, y: number, rot: number) =>
        `<g transform="translate(${x} ${y}) rotate(${rot}) translate(${-s / 2} ${-s / 2})">${markSvg({ ...kit, monogram: false }, s, color, { scale: 1 })}</g>`;
      return icon(q, q, -14) + icon(3 * q, 3 * q, 12);
    }
  }
}

// Patrón para fondos en pantalla (CSS background-image).
export function patternCss(kit: Pick<BrandKit, "pattern" | "icon" | "fonts">, color: string, opacity: number, tile = 64) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}"><g opacity="${opacity}">${patternTile(kit, tile, color)}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

// ---------- Propuestas por reglas (sin IA o si la IA falla) ----------

export type BusinessForKit = {
  name: string;
  industry: string | null;
  business_type: string | null;
  offers_delivery: boolean | null;
  payment_methods: string[];
  address_form: string | null;
  zone: string | null;
};

type Phrase = { tu: string; usted: string; vos: string };
const same = (s: string): Phrase => ({ tu: s, usted: s, vos: s });

const SLOGANS: [string[], Phrase[]][] = [
  [["ferreter"], [
    { tu: "Todo para tu obra, cerca de ti", usted: "Todo para su obra, cerca de usted", vos: "Todo para tu obra, cerca tuyo" },
    { tu: "Lo que tu casa pide, aquí lo hay", usted: "Lo que su casa pide, aquí lo hay", vos: "Lo que tu casa pide, aquí lo hay" },
    same("Del clavo al techo, con buen trato"),
  ]],
  [["pulper", "abarrot", "tienda", "minisuper", "bodega", "colmado"], [
    same("Lo de todos los días, a la vuelta de la casa"),
    { tu: "Tu tienda de confianza, siempre abierta para ti", usted: "Su tienda de confianza, siempre abierta para usted", vos: "Tu tienda de confianza, siempre abierta para vos" },
    { tu: "Lo que falta en casa, aquí lo encuentras", usted: "Lo que falta en casa, aquí lo encuentra", vos: "Lo que falta en casa, aquí lo encontrás" },
  ]],
  [["farmac"], [
    { tu: "Cuidamos tu salud de cerca", usted: "Cuidamos su salud de cerca", vos: "Cuidamos tu salud de cerca" },
    { tu: "Tu salud, en buenas manos", usted: "Su salud, en buenas manos", vos: "Tu salud, en buenas manos" },
    same("Atención que cura, precio que alivia"),
  ]],
  [["panader", "reposter"], [
    { tu: "Recién horneado para ti", usted: "Recién horneado para usted", vos: "Recién horneado para vos" },
    same("El olor del pan de siempre"),
    same("Dulces momentos, todos los días"),
  ]],
  [["salon", "estetica", "belleza", "barber"], [
    { tu: "Tu mejor versión empieza aquí", usted: "Su mejor versión empieza aquí", vos: "Tu mejor versión empieza aquí" },
    { tu: "Sal brillando", usted: "Salga brillando", vos: "Salí brillando" },
    same("Belleza con cariño y estilo"),
  ]],
  [["taller", "mecan"], [
    { tu: "Tu carro en buenas manos", usted: "Su carro en buenas manos", vos: "Tu carro en buenas manos" },
    same("Lo arreglamos bien, a la primera"),
    same("Mecánica honesta, sin vueltas"),
  ]],
  [["jardin"], [
    { tu: "Tu jardín, siempre bonito", usted: "Su jardín, siempre bonito", vos: "Tu jardín, siempre bonito" },
    same("Verde que da gusto"),
    same("Cuidamos lo que crece"),
  ]],
  [["restaurante", "comedor", "fritanga", "taqueria", "pizz"], [
    { tu: "Sabor que te hace volver", usted: "Sabor que lo hace volver", vos: "Sabor que te hace volver" },
    same("Comida de casa, sabor de siempre"),
    same("Aquí se come rico"),
  ]],
];

function slogansFor(b: BusinessForKit): string[] {
  const t = norm(b.industry ?? "");
  const hit = SLOGANS.find(([keys]) => keys.some((k) => t.includes(k)))?.[1] ?? [
    same("Calidad que se nota, trato que se siente"),
    { tu: "Hecho con cariño, pensado para ti", usted: "Hecho con cariño, pensado para usted", vos: "Hecho con cariño, pensado para vos" },
    { tu: "Cerca de ti, siempre", usted: "Cerca de usted, siempre", vos: "Cerca de vos, siempre" },
  ];
  return hit.map((p) => say(b.address_form as AddressForm, p));
}

export const captionFor = (b: Pick<BusinessForKit, "industry" | "zone">) =>
  [b.industry, b.zone].filter(Boolean).join(" · ").slice(0, 40);

export function rulesKits(b: BusinessForKit): BrandKit[] {
  const palettes = palettesFor(b.industry);
  const icons = iconsFor(b.industry);
  const extras = [
    b.offers_delivery ? "con entrega a domicilio" : null,
    b.payment_methods.some((m) => /fiado|cr[eé]dito/i.test(m)) ? "con crédito para clientes de confianza" : null,
  ].filter(Boolean);
  const proposition = `${b.industry ?? "Negocio"}${b.zone ? ` en ${b.zone}` : ""} con buen trato${extras.length ? `, ${extras.join(" y ")}` : ""}.`;
  const slogans = slogansFor(b);
  const caption = captionFor(b);
  const designs: Omit<BrandKit, "proposition" | "slogan" | "caption" | "palette" | "icon">[] = [
    { name: "Fuerte y confiable", concept: "Colores sólidos, letra firme y un escudo: transmite seriedad y que aquí el cliente encuentra lo que busca.", personality: ["Confiable", "Práctico", "Cercano"], tone: "Claro y directo, con buen trato.", fonts: "solida", shape: "shield", monogram: false, layout: "clasico", nameStyle: "mayusculas", pattern: "diagonales" },
    { name: "Moderno y profesional", concept: "El nombre es el protagonista, a dos colores: limpio, actual y fácil de recordar en redes y en la página web.", personality: ["Profesional", "Moderno", "Atento"], tone: "Profesional pero cálido.", fonts: "geometrica", shape: "rounded", monogram: false, layout: "palabra", nameStyle: "dos-tonos", pattern: "puntos" },
    { name: "Cercano y de barrio", concept: "Un sello redondo como los de antes, con las iniciales del negocio: el lugar de confianza de la zona.", personality: ["Amable", "Alegre", "De confianza"], tone: "Cercano, como un vecino.", fonts: "gordita", shape: "circle", monogram: true, layout: "emblema", nameStyle: "mayusculas", pattern: "iconos" },
  ];
  return designs.map((d, i) => ({
    ...d,
    proposition,
    slogan: slogans[i % slogans.length],
    caption,
    palette: palettes[i % palettes.length].id,
    colors: null,
    icon: icons[i % icons.length],
  }));
}

// Base de marca por reglas (si la IA no está disponible).
export function rulesBase(b: BusinessForKit, kit: BrandKit): BrandBase {
  const industry = (b.industry ?? "").toLowerCase();
  const what = industry ? `una ${industry}` : "un negocio";
  const where = b.zone ? ` en ${b.zone}` : "";
  const t = (p: Phrase) => say(b.address_form as AddressForm, p);
  return {
    story: `${b.name} nació${where} para que la gente tenga ${what} de confianza: con lo que necesita, precios claros y alguien que conoce a sus clientes por su nombre.`,
    mission: `Atender a cada cliente${where} con buen trato, precios claros y lo que necesita, cuando lo necesita.`,
    vision: `Ser ${what} de confianza de la zona: la primera opción que la gente recomienda.`,
    values: [
      { name: "Confianza", text: "Decimos la verdad sobre precios, tiempos y calidad." },
      { name: "Buen trato", text: "Cada cliente se va mejor de lo que llegó." },
      { name: "Cumplimiento", text: "Lo que prometemos, lo cumplimos." },
    ],
    audience: `Familias y vecinos${where} que buscan resolver rápido, con buena atención y un precio justo.`,
    promise: kit.proposition,
    messages: [kit.slogan, `Precios claros y buen trato${where}.`, b.offers_delivery ? "Entregas a domicilio." : "Atención rápida y con gusto."],
    voiceDo: [
      t({ tu: "Hola, ¿en qué te ayudamos hoy?", usted: "Buenas, ¿en qué le podemos ayudar?", vos: "Hola, ¿en qué te ayudamos hoy?" }),
      t({ tu: "Sí lo tenemos, te lo apartamos.", usted: "Sí lo tenemos, se lo apartamos.", vos: "Sí lo tenemos, te lo apartamos." }),
      "Gracias por preferirnos.",
    ],
    voiceDont: ["Lenguaje técnico que el cliente no entiende", "Promesas que no podemos cumplir", "Respuestas secas o de mal humor"],
    bio: `${kit.slogan} · ${b.industry ?? ""}${where}`.slice(0, 150),
    description: `${b.name} es ${what}${where}. ${kit.proposition}`.slice(0, 300),
    whatsappWelcome: t({
      tu: `¡Hola! Gracias por escribir a ${b.name}. Cuéntanos qué necesitas y te respondemos enseguida.`,
      usted: `¡Hola! Gracias por escribir a ${b.name}. Cuéntenos qué necesita y le respondemos enseguida.`,
      vos: `¡Hola! Gracias por escribir a ${b.name}. Contanos qué necesitás y te respondemos enseguida.`,
    }),
    hashtags: [b.name, b.industry ?? "", b.zone ?? ""]
      .filter(Boolean)
      .map((w) => `#${norm(w).replace(/[^a-z0-9]/g, "")}`)
      .filter((h) => h.length > 1),
    postIdeas: [
      "Preséntate: foto del negocio y del equipo con tu nuevo logo.",
      "Muestra tus 3 productos o servicios más pedidos, con precio.",
      "Comparte la opinión de un cliente contento.",
    ],
    photoStyle:
      "Fotos con buena luz natural, del negocio real y de clientes reales. Fondos ordenados, los colores de la marca presentes y nada de fotos borrosas o sacadas de internet.",
  };
}

// ---------- Saneado (todo lo que viene de la IA, del editor o de la base de datos) ----------

const str = (v: unknown, max: number, def: string) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : def);
const strList = (v: unknown, n: number, max: number, def: string[]) => {
  const list = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && Boolean(x.trim())) : [];
  return list.length ? list.slice(0, n).map((x) => x.trim().slice(0, max)) : def;
};
const oneOf = <T extends string>(v: unknown, list: readonly T[], def: T): T => (list.includes(v as T) ? (v as T) : def);

function sanitizeBase(v: unknown, fallback: BrandBase | null): BrandBase | null {
  if (!v || typeof v !== "object") return fallback;
  const o = v as Partial<BrandBase>;
  if (!fallback && typeof o.story !== "string") return null;
  const d: Partial<BrandBase> = fallback ?? {};
  const values = Array.isArray(o.values)
    ? o.values
        .filter((x) => x && typeof x === "object" && typeof x.name === "string" && x.name.trim())
        .slice(0, 4)
        .map((x) => ({ name: x.name.trim().slice(0, 40), text: str(x.text, 200, "") }))
    : [];
  return {
    story: str(o.story, 800, d.story ?? ""),
    mission: str(o.mission, 300, d.mission ?? ""),
    vision: str(o.vision, 300, d.vision ?? ""),
    values: values.length ? values : (d.values ?? []),
    audience: str(o.audience, 300, d.audience ?? ""),
    promise: str(o.promise, 200, d.promise ?? ""),
    messages: strList(o.messages, 4, 160, d.messages ?? []),
    voiceDo: strList(o.voiceDo, 4, 160, d.voiceDo ?? []),
    voiceDont: strList(o.voiceDont, 4, 160, d.voiceDont ?? []),
    bio: str(o.bio, 150, d.bio ?? ""),
    description: str(o.description, 500, d.description ?? ""),
    whatsappWelcome: str(o.whatsappWelcome, 300, d.whatsappWelcome ?? ""),
    hashtags: strList(o.hashtags, 8, 40, d.hashtags ?? []).map((h) => (h.startsWith("#") ? h : `#${h}`).replace(/\s+/g, "")),
    postIdeas: strList(o.postIdeas, 5, 220, d.postIdeas ?? []),
    photoStyle: str(o.photoStyle, 400, d.photoStyle ?? ""),
  };
}

// Corrige un kit: solo valores válidos de las colecciones curadas, colores que se leen bien.
export function sanitizeKit(k: Partial<BrandKit>, fallback: BrandKit): BrandKit {
  const colors = k.colors === undefined ? (fallback.colors ?? null) : fixColors(k.colors);
  const fonts = FONT_PAIRS.some((f) => f.id === k.fonts) ? k.fonts! : fallback.fonts;
  const nameStyle = oneOf(k.nameStyle, ["normal", "mayusculas", "dos-tonos"] as const, fallback.nameStyle ?? "normal");
  const curated = PALETTES.some((p) => p.id === k.palette) ? k.palette! : PALETTES.some((p) => p.id === fallback.palette) ? fallback.palette : PALETTES[0].id;
  return {
    name: str(k.name, 60, fallback.name),
    concept: str(k.concept, 400, fallback.concept),
    proposition: str(k.proposition, 240, fallback.proposition),
    personality: strList(k.personality, 3, 30, fallback.personality),
    tone: str(k.tone, 200, fallback.tone),
    slogan: str(k.slogan, 90, fallback.slogan),
    caption: typeof k.caption === "string" ? k.caption.trim().slice(0, 40) : (fallback.caption ?? ""),
    palette: colors ? "custom" : curated,
    colors,
    fonts,
    icon: k.icon && BRAND_ICONS[k.icon] ? k.icon : fallback.icon,
    shape: oneOf(k.shape, ["circle", "rounded", "hexagon", "shield", "diamond", "ring", "none"] as const, fallback.shape),
    monogram: typeof k.monogram === "boolean" ? k.monogram : fallback.monogram,
    layout: oneOf(k.layout, ["clasico", "apilado", "emblema", "palabra"] as const, fallback.layout ?? "clasico"),
    nameStyle: nameStyle === "mayusculas" && fontsById(fonts).script ? "normal" : nameStyle,
    pattern: oneOf(k.pattern, ["iconos", "puntos", "diagonales", "ondas", "cruces"] as const, fallback.pattern ?? "puntos"),
    base: sanitizeBase(k.base, k.base === null ? null : (fallback.base ?? null)),
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
