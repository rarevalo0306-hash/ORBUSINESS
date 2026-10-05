import "server-only";
import { writePsdBuffer } from "ag-psd";
import { AlignmentType, Document, Footer, Header, ImageRun, Packer, Paragraph, TextRun } from "docx";
import { zipSync } from "fflate";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import SVGtoPDF from "svg-to-pdfkit";
import { backdropSvg, cmykText, fontsById, kitPalette, rgbText, rulesBase, type BrandKit } from "@/lib/brand";
import {
  bolsaArt,
  camisetaArt,
  chatArt,
  cotizacionArt,
  historiaArt,
  iconoAppArt,
  letreroArt,
  membreteArt,
  perfilArt,
  portadaArt,
  publicacionArt,
  tableroArt,
  tarjetaArts,
  vehiculoArt,
  volanteArt,
  type BrandCtx,
} from "@/lib/brand-art";
import { artSvg, logoArt, type Art, type LogoTheme, type LogoVariant } from "@/lib/brand-render";

// Archivos del kit de marca en todos los formatos: SVG (vector), PNG (fondo transparente), JPG,
// PDF (vector: se abre y se edita en Illustrator), PSD (Photoshop, por capas), Word, paleta de
// Adobe (.ase) y todo junto en un .zip.

export type Format = "svg" | "png" | "jpg" | "pdf" | "psd" | "docx" | "ase" | "txt";
export type Group = "Presentación" | "Logo" | "Redes sociales" | "Papelería" | "Mockups" | "Colores y patrón";

type Item = {
  id: string;
  label: string;
  group: Group;
  formats: Format[];
  px: number; // ancho de PNG / JPG / PSD
  art?: (c: BrandCtx) => Promise<Art | Art[]>;
};

const welcomeFor = (c: BrandCtx) =>
  (
    c.kit.base ??
    rulesBase(
      { name: c.name, industry: c.industry, business_type: null, offers_delivery: null, payment_methods: c.paymentMethods, address_form: c.form, zone: c.zone },
      c.kit,
    )
  ).whatsappWelcome;

const logoItem = (id: string, label: string, variant: LogoVariant, theme: LogoTheme, formats: Format[], px: number): Item => ({
  id,
  label,
  group: "Logo",
  formats,
  px,
  art: (c) => logoArt(c.kit, c.name, variant, theme, c.fonts),
});

export const ITEMS: Item[] = [
  { id: "tablero", label: "Tablero de marca (presentación)", group: "Presentación", formats: ["png", "jpg", "pdf"], px: 2400, art: tableroArt },
  logoItem("logo", "Logo principal", "principal", "color", ["svg", "png", "jpg", "pdf", "psd"], 2400),
  logoItem("logo-vertical", "Logo vertical", "vertical", "color", ["svg", "png", "pdf"], 1600),
  logoItem("logo-blanco", "Logo en blanco (fondos oscuros)", "principal", "blanco", ["svg", "png", "pdf"], 2400),
  logoItem("logo-un-color", "Logo a un color", "principal", "mono", ["svg", "png", "pdf"], 2400),
  logoItem("isotipo", "Isotipo (solo el símbolo)", "isotipo", "color", ["svg", "png", "pdf"], 1200),
  logoItem("sello", "Sello redondo", "sello", "color", ["svg", "png", "pdf"], 1200),
  { id: "icono-app", label: "Ícono (app, favicon)", group: "Logo", formats: ["png"], px: 1024, art: iconoAppArt },
  { id: "perfil", label: "Foto de perfil", group: "Redes sociales", formats: ["png", "jpg", "psd"], px: 1000, art: perfilArt },
  { id: "portada", label: "Portada de Facebook", group: "Redes sociales", formats: ["png", "jpg", "psd"], px: 1640, art: portadaArt },
  { id: "publicacion", label: "Publicación (Instagram / Facebook)", group: "Redes sociales", formats: ["png", "jpg", "psd"], px: 1080, art: publicacionArt },
  { id: "historia", label: "Historia / Estado de WhatsApp", group: "Redes sociales", formats: ["png", "jpg", "psd"], px: 1080, art: historiaArt },
  { id: "tarjeta", label: "Tarjeta de presentación (imprenta, 2 caras)", group: "Papelería", formats: ["pdf", "png"], px: 1134, art: tarjetaArts },
  { id: "membrete", label: "Hoja membretada", group: "Papelería", formats: ["pdf", "docx", "png"], px: 1700, art: membreteArt },
  { id: "cotizacion", label: "Formato de cotización", group: "Papelería", formats: ["pdf", "png"], px: 1700, art: cotizacionArt },
  { id: "volante", label: "Volante", group: "Papelería", formats: ["pdf", "png", "jpg", "psd"], px: 1700, art: volanteArt },
  { id: "letrero", label: "Letrero del local", group: "Mockups", formats: ["png", "jpg"], px: 1600, art: letreroArt },
  { id: "camiseta", label: "Camiseta / uniforme", group: "Mockups", formats: ["png", "jpg"], px: 1200, art: camisetaArt },
  { id: "bolsa", label: "Bolsa", group: "Mockups", formats: ["png", "jpg"], px: 1200, art: bolsaArt },
  { id: "vehiculo", label: "Vehículo de reparto", group: "Mockups", formats: ["png", "jpg"], px: 1600, art: vehiculoArt },
  { id: "chat", label: "Chat de WhatsApp", group: "Mockups", formats: ["png"], px: 1000, art: (c) => chatArt(c, welcomeFor(c)) },
  { id: "fondo-oscuro", label: "Fondo de marca (oscuro)", group: "Colores y patrón", formats: ["svg", "png"], px: 2400, art: async (c) => fondoArt(c, "oscuro") },
  { id: "fondo-claro", label: "Fondo de marca (claro)", group: "Colores y patrón", formats: ["svg", "png"], px: 2400, art: async (c) => fondoArt(c, "claro") },
  { id: "colores", label: "Paleta de colores (Adobe .ase y texto)", group: "Colores y patrón", formats: ["ase", "txt"], px: 0 },
];

export const FORMAT_LABEL: Record<Format, string> = {
  svg: "SVG",
  png: "PNG",
  jpg: "JPG",
  pdf: "PDF (Illustrator)",
  psd: "PSD (Photoshop)",
  docx: "Word",
  ase: "Adobe .ase",
  txt: "Texto",
};

const MIME: Record<Format | "zip", string> = {
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  pdf: "application/pdf",
  psd: "image/vnd.adobe.photoshop",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ase: "application/octet-stream",
  txt: "text/plain; charset=utf-8",
  zip: "application/zip",
};

export const ZIP_NAME = "kit-de-marca.zip";

export function parseFile(file: string): { item: Item; format: Format } | "zip" | null {
  if (file === ZIP_NAME) return "zip";
  const m = file.match(/^([a-z-]+)\.([a-z]+)$/);
  const item = m && ITEMS.find((i) => i.id === m[1]);
  if (!item || !item.formats.includes(m![2] as Format)) return null;
  return { item, format: m![2] as Format };
}

// ---------- Codificadores ----------

const first = (a: Art | Art[]) => (Array.isArray(a) ? a[0] : a);

async function toPng(art: Art, width: number) {
  const density = Math.min(2400, (72 * width) / art.width);
  return sharp(Buffer.from(artSvg(art)), { density }).resize({ width: Math.round(width) }).png().toBuffer();
}

async function toJpg(art: Art, width: number) {
  return sharp(await toPng(art, width)).flatten({ background: "#FFFFFF" }).jpeg({ quality: 92 }).toBuffer();
}

function toPdf(arts: Art[], title: string, scale = 1): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, margin: 0, info: { Title: title, Creator: "Orbusiness" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    for (const a of arts) {
      const w = a.width * scale;
      const h = a.height * scale;
      doc.addPage({ size: [w, h], margin: 0 });
      SVGtoPDF(doc, artSvg(a, scale), 0, 0, { width: w, height: h, assumePt: true });
    }
    doc.end();
  });
}

// Recorta una capa a los píxeles visibles (las capas de Photoshop guardan solo su área).
function cropLayer(img: { width: number; height: number; data: Uint8ClampedArray }) {
  const { width, height, data } = img;
  let [minX, minY, maxX, maxY] = [width, height, -1, -1];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { left: 0, top: 0, imageData: { width: 1, height: 1, data: new Uint8ClampedArray(4) } };
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) out.set(data.subarray(((minY + y) * width + minX) * 4, ((minY + y) * width + minX + w) * 4), y * w * 4);
  return { left: minX, top: minY, imageData: { width: w, height: h, data: out } };
}

async function toPsd(art: Art, width: number) {
  const W = Math.round(width);
  const H = Math.round((art.height * width) / art.width);
  const raster = async (inner: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.width} ${art.height}" width="${W}" height="${H}">${inner}</svg>`;
    const { data, info } = await sharp(Buffer.from(svg)).resize(W, H).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    return { width: info.width, height: info.height, data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.length) };
  };
  const children = [];
  for (const layer of art.layers) children.push({ name: layer.name, ...cropLayer(await raster(layer.svg)) });
  const composite = await raster(art.layers.map((l) => l.svg).join(""));
  return Buffer.from(writePsdBuffer({ width: W, height: H, imageData: composite, children }, { generateThumbnail: false, noBackground: true }));
}

// Paleta de Adobe (.ase): se importa en Illustrator, Photoshop e InDesign.
function toAse(colors: { name: string; hex: string }[]) {
  const blocks = colors.map(({ name, hex }) => {
    const label = Buffer.alloc(2 + (name.length + 1) * 2);
    label.writeUInt16BE(name.length + 1, 0);
    for (let i = 0; i < name.length; i++) label.writeUInt16BE(name.charCodeAt(i), 2 + i * 2);
    const body = Buffer.alloc(4 + 12 + 2);
    body.write("RGB ", 0, "ascii");
    [1, 3, 5].forEach((o, i) => body.writeFloatBE(parseInt(hex.slice(o, o + 2), 16) / 255, 4 + i * 4));
    body.writeUInt16BE(2, 16); // color normal
    const head = Buffer.alloc(6);
    head.writeUInt16BE(0x0001, 0);
    head.writeUInt32BE(label.length + body.length, 2);
    return Buffer.concat([head, label, body]);
  });
  const header = Buffer.alloc(12);
  header.write("ASEF", 0, "ascii");
  header.writeUInt16BE(1, 4);
  header.writeUInt16BE(0, 6);
  header.writeUInt32BE(blocks.length, 8);
  return Buffer.concat([header, ...blocks]);
}

function paletteList(c: BrandCtx) {
  const p = kitPalette(c.kit);
  return [
    { name: "Principal", hex: p.primary },
    { name: "Secundario", hex: p.secondary },
    { name: "Acento", hex: p.accent },
    { name: "Oscuro", hex: p.dark },
    { name: "Claro", hex: p.light },
  ];
}

function fondoArt(c: BrandCtx, tone: "oscuro" | "claro"): Art {
  return { width: 1600, height: 1000, layers: [{ name: "Fondo", svg: backdropSvg(c.kit, 1600, 1000, tone) }] };
}

async function toDocx(c: BrandCtx) {
  const p = kitPalette(c.kit);
  const f = fontsById(c.kit.fonts);
  const logo = await logoArt(c.kit, c.name, "principal", "color", c.fonts);
  const png = await toPng(logo, 900);
  const lines = [c.phone, c.address, c.siteUrl?.replace(/^https?:\/\//, "")].filter((v): v is string => Boolean(v));
  const logoW = 200;
  const doc = new Document({
    creator: "Orbusiness",
    title: `Membrete ${c.name}`,
    styles: { default: { document: { run: { font: f.body.family, size: 22 } } } },
    sections: [
      {
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 2000, bottom: 1500, left: 1080, right: 1080, header: 600, footer: 500 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [new ImageRun({ type: "png", data: png, transformation: { width: logoW, height: Math.round((logoW * logo.height) / logo.width) } })],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: "single", size: 12, color: p.primary.slice(1), space: 4 } },
                children: lines.map((l, i) => new TextRun({ text: l, size: 17, color: p.dark.slice(1), break: i ? 1 : 0 })),
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: [c.kit.slogan, c.siteUrl?.replace(/^https?:\/\//, "")].filter(Boolean).join("   ·   "), size: 16, color: p.primary.slice(1) })],
              }),
            ],
          }),
        },
        children: [new Paragraph({ children: [new TextRun({ text: "" })] })],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

// Logo principal en PNG (para guardarlo en internet: firma de email).
export async function logoPng(kit: BrandKit, name: string, width: number) {
  return toPng(await logoArt(kit, name, "principal", "color"), width);
}

// ---------- Generar ----------

export async function brandFile(c: BrandCtx, item: Item, format: Format): Promise<{ data: Buffer; type: string }> {
  const out = async (): Promise<Buffer | string> => {
    if (item.id === "colores") {
      const list = paletteList(c);
      if (format === "ase") return toAse(list);
      return list.map((x) => `${x.name}\tHEX ${x.hex}\tRGB ${rgbText(x.hex)}\tCMYK ${cmykText(x.hex)}`).join("\n") + "\n";
    }
    if (format === "docx") return toDocx(c);
    const arts = await item.art!(c);
    const list = Array.isArray(arts) ? arts : [arts];
    switch (format) {
      case "svg":
        return artSvg(first(arts));
      case "png":
        return toPng(first(arts), item.px);
      case "jpg":
        return toJpg(first(arts), item.px);
      case "pdf":
        // Logos: página del tamaño del logo, ampliada para que se vea bien al abrirla.
        return toPdf(list, `${item.label} · ${c.name}`, item.group === "Logo" ? 3 : 1);
      case "psd":
        return toPsd(first(arts), item.px);
      default:
        throw new Error("Formato no disponible");
    }
  };
  const data = await out();
  return { data: typeof data === "string" ? Buffer.from(data) : data, type: MIME[format] };
}

// Todo el kit en un .zip, ordenado en carpetas.
export async function brandZip(c: BrandCtx) {
  const files: Record<string, Uint8Array> = {};
  for (const item of ITEMS) {
    for (const format of item.formats) {
      const { data } = await brandFile(c, item, format);
      files[`${item.group}/${item.id}.${format}`] = new Uint8Array(data);
    }
  }
  return { data: Buffer.from(zipSync(files, { level: 6 })), type: MIME.zip };
}
