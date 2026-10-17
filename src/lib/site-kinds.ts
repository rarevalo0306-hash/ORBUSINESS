// Tipo de página según el giro: no es lo mismo un restaurante que un taller o un estudio de fotografía.
// Define la página principal de catálogo (Tienda, Menú, Servicios o Portafolio), sus textos y qué se muestra primero.

export type SiteKind = "tienda" | "restaurante" | "servicios" | "portafolio";

export type KindInfo = {
  kind: SiteKind;
  path: string; // /sitio/<negocio>/<path>
  label: string; // en el menú
  title: string; // título de la página
  intro: string;
  itemsWord: string; // "productos", "platillos", "servicios", "trabajos"
};

const KINDS: Record<SiteKind, Omit<KindInfo, "kind">> = {
  tienda: { path: "tienda", label: "Tienda", title: "Nuestra tienda", intro: "Elige lo que necesitas, agrégalo a tu pedido y te lo llevamos o pasas por él.", itemsWord: "productos" },
  restaurante: { path: "menu", label: "Menú", title: "Nuestro menú", intro: "Pide para llevar, a domicilio o reserva tu mesa.", itemsWord: "platillos" },
  servicios: { path: "servicios", label: "Servicios", title: "Nuestros servicios", intro: "Mira lo que hacemos y pide tu cotización o agenda tu cita.", itemsWord: "servicios" },
  portafolio: { path: "portafolio", label: "Portafolio", title: "Nuestro trabajo", intro: "Algunos de nuestros proyectos y los servicios que ofrecemos.", itemsWord: "trabajos" },
};

const MATCH: [SiteKind, RegExp][] = [
  ["restaurante", /restaur|comida|cocina|caf[eé]|cafeter|pizz|taquer|tacos|pupuser|fritang|soda|bar\b|cevich|marisc|hamburgues|sushi|food|catering|banquete/],
  ["portafolio", /fot[oó]graf|foto|video|dise[nñ]|arquitect|estudio|arte|tatuaj|tattoo|ilustra|bodas|eventos|decoraci|interiorism|publicidad|marketing|agencia/],
  ["tienda", /panad|pasteler|reposter|tienda|ropa|boutique|ferreter|abarrot|pulper|super|mercado|farmac|florer|libr|jugueter|zapater|cosm[eé]tic|joyer|electr[oó]nic|repuesto|muebler|verduler|carnicer|licorer|vivero/],
];

export function siteKind(industry: string | null | undefined, businessType: string | null | undefined): KindInfo {
  const text = (industry ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  // Un negocio que dijo que vende servicios no es tienda aunque el giro diga "ropa" (p. ej. alteraciones de ropa).
  const found = MATCH.find(([k, re]) => re.test(text) && !(k === "tienda" && businessType === "services"))?.[0];
  const kind: SiteKind = found ?? (businessType === "products" ? "tienda" : "servicios");
  return { kind, ...KINDS[kind] };
}

export const CATALOG_PATHS = Object.values(KINDS).map((k) => k.path);
