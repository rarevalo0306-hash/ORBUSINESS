// Plantillas de página web. Cada una combina variantes de secciones con un estilo (modo de color,
// esquinas y tamaño de títulos). Todas se adaptan a celular, tablet y computadora, y toman los
// colores, letras y logo del kit de marca del negocio.

export type HeroVariant = "dividido" | "centrado" | "imagen" | "editorial" | "tarjeta" | "bento";
export type ServicesVariant = "tarjetas" | "menu" | "numerado" | "destacados";
export type AboutVariant = "historia" | "valores" | "ninguno";
export type GalleryVariant = "cuadricula" | "tira" | "mosaico";
export type ContactVariant = "dividido" | "banda" | "tarjeta";
export type Mode = "claro" | "tinte" | "oscuro" | "contraste";
export type Corners = "rectas" | "suaves" | "redondas";

export type SiteTemplate = {
  id: string;
  name: string;
  description: string;
  goodFor: string; // para qué negocios queda bien
  hero: HeroVariant;
  services: ServicesVariant;
  about: AboutVariant;
  gallery: GalleryVariant;
  contact: ContactVariant;
  mode: Mode;
  corners: Corners;
  big: boolean; // títulos extra grandes
};

export const SITE_TEMPLATES: SiteTemplate[] = [
  { id: "clasica", name: "Clásica", description: "Texto a un lado e imagen al otro. Clara y directa.", goodFor: "Cualquier negocio", hero: "dividido", services: "tarjetas", about: "historia", gallery: "cuadricula", contact: "dividido", mode: "claro", corners: "suaves", big: false },
  { id: "vitrina", name: "Vitrina", description: "Una foto grande de entrada, como la vitrina del local.", goodFor: "Tiendas, ropa, ferreterías", hero: "imagen", services: "tarjetas", about: "valores", gallery: "tira", contact: "banda", mode: "claro", corners: "redondas", big: false },
  { id: "editorial", name: "Editorial", description: "Títulos enormes y mucho espacio, como una revista.", goodFor: "Estudios, boutiques, cafés", hero: "editorial", services: "numerado", about: "historia", gallery: "mosaico", contact: "tarjeta", mode: "claro", corners: "rectas", big: true },
  { id: "menu", name: "Menú", description: "Lista de productos con precios, como la carta de un restaurante.", goodFor: "Comida, panaderías, cafeterías", hero: "centrado", services: "menu", about: "valores", gallery: "tira", contact: "dividido", mode: "tinte", corners: "suaves", big: false },
  { id: "bento", name: "Bento", description: "Bloques ordenados con lo importante a la vista.", goodFor: "Servicios, tecnología, talleres", hero: "bento", services: "destacados", about: "valores", gallery: "cuadricula", contact: "tarjeta", mode: "claro", corners: "redondas", big: false },
  { id: "noche", name: "Noche", description: "Fondo oscuro y elegante, resalta los colores de la marca.", goodFor: "Barberías, bares, gimnasios", hero: "centrado", services: "tarjetas", about: "historia", gallery: "cuadricula", contact: "banda", mode: "oscuro", corners: "suaves", big: true },
  { id: "barrio", name: "Barrio", description: "Cercana, con los datos clave en una tarjeta al frente.", goodFor: "Pulperías, tiendas de barrio", hero: "tarjeta", services: "menu", about: "valores", gallery: "tira", contact: "dividido", mode: "tinte", corners: "redondas", big: false },
  { id: "minimal", name: "Minimal", description: "Solo lo esencial, con letra protagonista.", goodFor: "Profesionales, consultorios", hero: "editorial", services: "menu", about: "ninguno", gallery: "cuadricula", contact: "tarjeta", mode: "claro", corners: "rectas", big: false },
  { id: "impacto", name: "Impacto", description: "Colores fuertes y títulos grandes que no pasan desapercibidos.", goodFor: "Promociones, deportes, eventos", hero: "imagen", services: "numerado", about: "valores", gallery: "mosaico", contact: "banda", mode: "contraste", corners: "rectas", big: true },
  { id: "fresca", name: "Fresca", description: "Ligera y alegre, con esquinas redondas.", goodFor: "Heladerías, florerías, jugos", hero: "dividido", services: "destacados", about: "valores", gallery: "tira", contact: "dividido", mode: "tinte", corners: "redondas", big: false },
  { id: "elegante", name: "Elegante", description: "Oscura, sobria y con mucho espacio.", goodFor: "Joyerías, belleza, restaurantes", hero: "centrado", services: "menu", about: "historia", gallery: "mosaico", contact: "tarjeta", mode: "oscuro", corners: "rectas", big: true },
  { id: "taller", name: "Taller", description: "Ordenada y práctica, con servicios numerados.", goodFor: "Mecánicos, ferreterías, oficios", hero: "dividido", services: "numerado", about: "valores", gallery: "cuadricula", contact: "banda", mode: "claro", corners: "rectas", big: false },
  { id: "mercado", name: "Mercado", description: "Bloques con fotos y datos, ideal para muchos productos.", goodFor: "Mercados, abarroterías, verdulerías", hero: "bento", services: "tarjetas", about: "ninguno", gallery: "tira", contact: "dividido", mode: "tinte", corners: "redondas", big: false },
  { id: "estudio", name: "Estudio", description: "Diseño de autor, con galería tipo mosaico.", goodFor: "Fotografía, diseño, arquitectura", hero: "editorial", services: "tarjetas", about: "historia", gallery: "mosaico", contact: "dividido", mode: "claro", corners: "suaves", big: true },
  { id: "calida", name: "Cálida", description: "Fondo de marca con una tarjeta acogedora al frente.", goodFor: "Cafés, hospedajes, panaderías", hero: "tarjeta", services: "tarjetas", about: "historia", gallery: "cuadricula", contact: "tarjeta", mode: "tinte", corners: "suaves", big: false },
  { id: "contraste", name: "Contraste", description: "Todo en el color de la marca, muy llamativa.", goodFor: "Marcas jóvenes, comida rápida", hero: "centrado", services: "destacados", about: "valores", gallery: "tira", contact: "banda", mode: "contraste", corners: "redondas", big: true },
  { id: "clinica", name: "Clínica", description: "Limpia y confiable, con información clara.", goodFor: "Salud, farmacias, veterinarias", hero: "dividido", services: "menu", about: "valores", gallery: "cuadricula", contact: "tarjeta", mode: "claro", corners: "suaves", big: false },
  { id: "salon", name: "Salón", description: "Foto protagonista sobre fondo oscuro.", goodFor: "Salones de belleza, spas, estética", hero: "imagen", services: "menu", about: "historia", gallery: "mosaico", contact: "tarjeta", mode: "oscuro", corners: "redondas", big: false },
  { id: "express", name: "Express", description: "Una sola pantalla con lo justo para que te escriban.", goodFor: "Negocios que venden por WhatsApp", hero: "centrado", services: "tarjetas", about: "ninguno", gallery: "tira", contact: "dividido", mode: "claro", corners: "redondas", big: false },
  { id: "premium", name: "Premium", description: "Oscura, editorial y con servicios numerados.", goodFor: "Servicios profesionales, lujo", hero: "editorial", services: "numerado", about: "valores", gallery: "tira", contact: "banda", mode: "oscuro", corners: "rectas", big: true },
];

export const templateById = (id: string | null | undefined) => SITE_TEMPLATES.find((t) => t.id === id) ?? SITE_TEMPLATES[0];
