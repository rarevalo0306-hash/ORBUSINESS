import "server-only";
import {
  PALETTES,
  backdropSvg,
  cmykText,
  contrast,
  fontsById,
  gradientEnd,
  kitPalette,
  mixHex,
  onColor,
  rgbText,
  logoType,
  rulesBase,
  type BrandBase,
} from "@/lib/brand";
import {
  bolsaArt,
  camisetaArt,
  chatArt,
  cotizacionArt,
  historiaArt,
  letreroArt,
  membreteArt,
  perfilArt,
  publicacionArt,
  sistemaArt,
  tarjetaArts,
  vehiculoArt,
  volanteArt,
  type BrandCtx,
} from "@/lib/brand-art";
import { capRatio, logoArt, measure, paragraphSvg, place, textSvg, type Art } from "@/lib/brand-render";

// Manual de marca como libro de agencia: páginas horizontales (16:9) con mucho espacio, letra grande
// y las piezas reales de la marca. Se entrega como PDF vectorial y se muestra en pantalla página por página.

const W = 1920;
const H = 1080;
const M = 120;
const TITLE = -0.03;

export const baseFor = (c: BrandCtx): BrandBase =>
  c.kit.base ??
  rulesBase(
    { name: c.name, industry: c.industry, business_type: null, offers_delivery: null, payment_methods: c.paymentMethods, address_form: c.form, zone: c.zone },
    c.kit,
  );

let uid = 0;
const nextId = () => `bk${++uid}`;

function tools(c: BrandCtx) {
  const p = kitPalette(c.kit);
  const ink = p.dark;
  const grey = mixHex(p.dark, "#FFFFFF", 0.42);
  const accentText = contrast(p.primary, p.light) >= 4.5 ? p.primary : p.dark;
  const H1 = c.fonts.heading;
  const B = c.fonts.body;
  return {
    p,
    ink,
    grey,
    accentText,
    title: (text: string, x: number, y: number, size = 76, color = ink, width = 1300, maxLines = 3) =>
      paragraphSvg(H1, text, x, y, width, size, color, { maxLines, lineHeight: 1.02, tracking: TITLE }),
    body: (text: string, x: number, y: number, width: number, size = 28, color = ink, maxLines = 8, lineHeight = 1.42) =>
      paragraphSvg(B, text, x, y, width, size, color, { maxLines, lineHeight }),
    label: (text: string, x: number, y: number, color = accentText, anchor: "start" | "end" | "middle" = "start") =>
      textSvg(B, text.toLocaleUpperCase("es"), x, y, 17, color, { tracking: 0.16, anchor }),
    head: (text: string, x: number, y: number, size: number, color = ink, anchor: "start" | "end" | "middle" = "start") =>
      textSvg(H1, text, x, y, size, color, { tracking: -0.02, anchor }),
    card: (x: number, y: number, w: number, h: number, fill: string, rx = 28, stroke?: string) =>
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="2"` : ""}/>`,
    // Recuadro redondeado con contenido recortado.
    clip: (x: number, y: number, w: number, h: number, inner: string, rx = 28) => {
      const id = nextId();
      return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath></defs><g clip-path="url(#${id})">${inner}</g>`;
    },
    // Fondo de marca dentro de un área.
    backdrop: (x: number, y: number, w: number, h: number, tone: "oscuro" | "claro") => `<g transform="translate(${x} ${y})">${backdropSvg(c.kit, w, h, tone)}</g>`,
    shadow: (x: number, y: number, w: number, h: number) => {
      const id = nextId();
      return `<defs><radialGradient id="${id}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="${x + w / 2}" cy="${y + h + 14}" rx="${w * 0.55}" ry="26" fill="url(#${id})"/>`;
    },
  };
}

type Tools = ReturnType<typeof tools>;

// Encabezado de sección y pie de página.
function chrome(c: BrandCtx, t: Tools, n: number, section: string, tone: "claro" | "oscuro" = "claro") {
  const color = tone === "oscuro" ? "#FFFFFF" : t.accentText;
  const muted = tone === "oscuro" ? "#FFFFFF" : t.grey;
  return (
    t.label(section, M, 96, color) +
    textSvg(c.fonts.body, c.name, M, H - 56, 17, muted, { opacity: tone === "oscuro" ? 0.7 : 1 }) +
    textSvg(c.fonts.body, String(n).padStart(2, "0"), W - M, H - 56, 17, muted, { anchor: "end", opacity: tone === "oscuro" ? 0.7 : 1 })
  );
}

const pageOf = (layers: [string, string][]): Art => ({ width: W, height: H, layers: layers.map(([name, svg]) => ({ name, svg })) });

export async function bookPages(c: BrandCtx): Promise<Art[]> {
  const t = tools(c);
  const { p } = t;
  const base = baseFor(c);
  const f = fontsById(c.kit.fonts);
  const logo = (variant: Parameters<typeof logoArt>[2], theme: Parameters<typeof logoArt>[3], kit = c.kit) => logoArt(kit, c.name, variant, theme, c.fonts);
  const year = new Date().getFullYear();
  const pages: Art[] = [];
  const add = (layers: [string, string][]) => pages.push(pageOf(layers));
  const n = () => pages.length + 1;

  // 1. Portada
  add([
    ["Fondo", backdropSvg(c.kit, W, H, "oscuro")],
    [
      "Portada",
      t.label("Manual de marca", M, 120, "#FFFFFF") +
        textSvg(c.fonts.body, `Edición ${year}`, W - M, 120, 17, "#FFFFFF", { anchor: "end", tracking: 0.16, opacity: 0.75 }) +
        place(await logo("principal", "blanco"), M, 330, 1150, 360, "start").svg +
        t.body(c.kit.slogan, M, 880, 900, 34, "#FFFFFF", 2).svg,
    ],
  ]);

  // 2. Contenido
  const sections = ["Nuestra marca", "Logotipo", "Color", "Tipografía", "Fondos y fotos", "Redes sociales", "Papelería", "Aplicaciones"];
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="${p.light}"/>`],
    [
      "Contenido",
      t.title("Contenido", M, 200, 96).svg +
        sections
          .map((s, i) => {
            const col = i < 4 ? 0 : 1;
            const y = 470 + (i % 4) * 110;
            const x = M + col * 840;
            return t.head(String(i + 1).padStart(2, "0"), x, y, 40, t.accentText) + t.head(s, x + 110, y, 44) + `<line x1="${x}" y1="${y + 34}" x2="${x + 720}" y2="${y + 34}" stroke="${mixHex(p.light, p.dark, 0.12)}" stroke-width="2"/>`;
          })
          .join(""),
    ],
  ]);

  // 3. Historia
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>` + t.clip(0, 0, 820, H, t.backdrop(0, 0, 820, H, "oscuro"), 0)],
    [
      "Historia",
      t.label("Nuestra promesa", M, 300, "#FFFFFF") +
        t.title(`“${base.promise || c.kit.proposition}”`, M, 350, 58, "#FFFFFF", 600, 7).svg +
        t.label("Nuestra historia", 940, 220) +
        t.body(base.story, 940, 260, 860, 30, t.ink, 10, 1.45).svg +
        t.label("Misión", 940, 760) +
        t.body(base.mission, 940, 795, 400, 24, t.ink, 5, 1.4).svg +
        t.label("Visión", 1400, 760) +
        t.body(base.vision, 1400, 795, 400, 24, t.ink, 5, 1.4).svg,
    ],
    ["Encabezado", chrome(c, t, n(), "01 · Nuestra marca", "oscuro")],
  ]);

  // 4. Valores y cliente ideal
  const values = base.values.slice(0, 4);
  const vw = (W - 2 * M - (values.length - 1) * 30) / Math.max(values.length, 1);
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="${p.light}"/>`],
    [
      "Valores",
      t.title("Lo que nos mueve", M, 170, 76).svg +
        values
          .map((v, i) => {
            const x = M + i * (vw + 30);
            return t.card(x, 330, vw, 380, "#FFFFFF") + t.head(String(i + 1).padStart(2, "0"), x + 44, 400, 26, t.accentText) + t.title(v.name, x + 44, 440, 44, t.ink, vw - 88, 2).svg + t.body(v.text, x + 44, 560, vw - 88, 24, t.grey, 5, 1.4).svg;
          })
          .join("") +
        t.label("Nuestro cliente ideal", M, 800) +
        t.body(base.audience, M, 835, 1500, 30, t.ink, 3).svg,
    ],
    ["Encabezado", chrome(c, t, n(), "01 · Nuestra marca")],
  ]);

  // 5. Personalidad y voz
  let px = M;
  const chips = c.kit.personality
    .map((word) => {
      const w = measure(c.fonts.heading, word, 30) + 64;
      const svg = t.card(px, 300, w, 72, p.primary, 36) + textSvg(c.fonts.heading, word, px + 32, 336 + (capRatio(c.fonts.heading) * 30) / 2, 30, onColor(p.primary, p.dark));
      px += w + 16;
      return svg;
    })
    .join("");
  const list = (items: string[], x: number, y: number, w: number, color: string) =>
    items.map((it, i) => `<circle cx="${x + 8}" cy="${y + 18 + i * 92}" r="7" fill="${color}"/>` + t.body(it, x + 34, y + i * 92, w - 34, 26, t.ink, 2, 1.3).svg).join("");
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`],
    [
      "Voz",
      t.title("Cómo somos y cómo hablamos", M, 170, 72).svg +
        chips +
        t.body(c.kit.tone, M, 420, 1600, 30, t.grey, 2).svg +
        t.card(M, 530, 820, 400, mixHex(p.secondary, "#FFFFFF", 0.55)) +
        t.label("Así sí hablamos", M + 50, 600, t.ink) +
        list(base.voiceDo.slice(0, 3), M + 50, 640, 720, p.primary) +
        t.card(980, 530, 820, 400, "#FFFFFF", 28, mixHex("#FFFFFF", p.dark, 0.12)) +
        t.label("Así no", 1030, 600, t.ink) +
        list(base.voiceDont.slice(0, 3), 1030, 640, 720, "#D14343"),
    ],
    ["Encabezado", chrome(c, t, n(), "01 · Nuestra marca")],
  ]);

  // 6. Logo principal
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`],
    ["Logo", place(await logo("principal", "color"), 300, 280, 1320, 440).svg],
    [
      "Texto",
      t.label(`Tipo de logo: ${logoType(c.kit).name}`, M, 870) +
        t.body(`${logoType(c.kit).note} Úsalo siempre que haya espacio: es la versión que mejor representa a la marca.`, M, 900, 1300, 24, t.grey, 2).svg,
    ],
    ["Encabezado", chrome(c, t, n(), "02 · Logotipo")],
  ]);

  // 7. Versiones
  const tiles: [Parameters<typeof logoArt>[2], Parameters<typeof logoArt>[3], string, "white" | "light" | "dark"][] = [
    ["principal", "color", "Principal", "white"],
    ["vertical", "color", "Vertical", "light"],
    ["principal", "blanco", "En blanco, sobre fondos oscuros", "dark"],
    ["principal", "mono", "A un color", "white"],
    ["isotipo", "color", "Isotipo (el símbolo solo)", "light"],
    ["sello", "color", "Sello", "white"],
  ];
  const tw = (W - 2 * M - 2 * 30) / 3;
  const th = 300;
  let versions = "";
  for (const [i, [variant, theme, cap, bg]] of tiles.entries()) {
    const x = M + (i % 3) * (tw + 30);
    const y = 190 + Math.floor(i / 3) * (th + 80);
    const fill = bg === "white" ? "#FFFFFF" : bg === "light" ? p.light : "";
    const inner = (bg === "dark" ? t.backdrop(x, y, tw, th, "oscuro") : `<rect x="${x}" y="${y}" width="${tw}" height="${th}" fill="${fill}"/>`) + place(await logo(variant, theme), x + 60, y + 60, tw - 120, th - 120).svg;
    versions += t.clip(x, y, tw, th, inner) + (bg === "white" ? `<rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="28" fill="none" stroke="${mixHex("#FFFFFF", p.dark, 0.1)}" stroke-width="2"/>` : "") + t.body(cap, x, y + th + 22, tw, 22, t.grey, 1).svg;
  }
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`],
    ["Versiones", versions],
    ["Encabezado", chrome(c, t, n(), "02 · Logotipo · Versiones")],
  ]);

  // 7b. Sistema dinámico
  const sistema = await sistemaArt(c);
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`],
    [
      "Sistema dinámico",
      t.title("Un logo, muchos colores", M, 150, 64, t.ink, 1100).svg +
        t.body("Como las marcas dinámicas (MTV, Google), tu logo puede cambiar de fondo y color según el uso, sin perder su forma: redes, temporadas, promociones o productos.", M, 240, 1300, 24, t.grey, 2).svg +
        place(sistema, M, 330, W - 2 * M, 640).svg,
    ],
    ["Encabezado", chrome(c, t, n(), "02 · Logotipo · Sistema dinámico")],
  ]);

  // 8. Espacio y tamaño mínimo
  const main = await logo("principal", "color");
  const box = place(main, 260, 330, 760, 300);
  const pad = Math.min(box.h, 120) * 0.5;
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="${p.light}"/>`],
    [
      "Construcción",
      t.card(200, 250, 880, 460, "#FFFFFF") +
        `<rect x="${box.x - pad}" y="${box.y - pad}" width="${box.w + 2 * pad}" height="${box.h + 2 * pad}" fill="none" stroke="${t.accentText}" stroke-width="2" stroke-dasharray="10 8"/>` +
        box.svg +
        t.head("x", box.x - pad / 2, box.y - pad / 2 + 8, 22, t.accentText, "middle") +
        t.title("Espacio y tamaño", 1180, 250, 60, t.ink, 620).svg +
        t.body("Deja libre alrededor del logo un espacio igual a la mitad del alto del símbolo (x). Ahí no va texto, fotos ni otros logos.", 1180, 360, 600, 26, t.ink, 6).svg +
        t.label("Tamaño mínimo", 1180, 620) +
        t.body("Logo: 3 cm impreso · 120 px en pantalla.", 1180, 650, 600, 26, t.ink, 2).svg +
        t.body("Símbolo: 1 cm impreso · 32 px en pantalla.", 1180, 700, 600, 26, t.ink, 2).svg,
    ],
    ["Encabezado", chrome(c, t, n(), "02 · Logotipo · Construcción")],
  ]);

  // 9. Usos incorrectos
  const other = PALETTES.find((x) => x.id !== c.kit.palette && contrast(x.primary, p.primary) > 2) ?? PALETTES[1];
  const wrong = ["No lo estires", "No lo gires", "No le cambies los colores", "No lo pongas donde no se lee"];
  const ww = (W - 2 * M - 3 * 30) / 4;
  let misuse = "";
  for (const [i, cap] of wrong.entries()) {
    const x = M + i * (ww + 30);
    const y = 300;
    const hh = 360;
    const bg = i === 3 ? p.primary : "#FFFFFF";
    const art = i === 2 ? await logo("principal", "color", { ...c.kit, palette: other.id, colors: null }) : main;
    const pl = place(art, x + 70, y + 110, ww - 140, hh - 220);
    const cx = pl.x + pl.w / 2;
    const cy = pl.y + pl.h / 2;
    const tf = i === 0 ? `transform="translate(${cx} ${cy}) scale(1.3 0.75) translate(${-cx} ${-cy})"` : i === 1 ? `transform="rotate(-16 ${cx} ${cy})"` : "";
    misuse +=
      t.clip(x, y, ww, hh, `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="${bg}"/><g ${tf}>${pl.svg}</g>`) +
      `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" rx="28" fill="none" stroke="${mixHex("#FFFFFF", p.dark, 0.1)}" stroke-width="2"/>` +
      `<circle cx="${x + ww - 44}" cy="${y + 44}" r="22" fill="#D14343"/><path d="M${x + ww - 52} ${y + 36}L${x + ww - 36} ${y + 52}M${x + ww - 36} ${y + 36}L${x + ww - 52} ${y + 52}" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>` +
      t.body(cap, x, y + hh + 26, ww, 24, t.ink, 2).svg;
  }
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`],
    ["Usos incorrectos", t.title("Así no", M, 170, 76).svg + misuse],
    ["Encabezado", chrome(c, t, n(), "02 · Logotipo · Usos incorrectos")],
  ]);

  // 10. Colores
  const colors = [
    { role: "Principal", hex: p.primary, share: 0.3, use: "Logo, botones y títulos" },
    { role: "Secundario", hex: p.secondary, share: 0.17, use: "Fondos y apoyos" },
    { role: "Acento", hex: p.accent, share: 0.17, use: "Detalles y ofertas" },
    { role: "Oscuro", hex: p.dark, share: 0.18, use: "Textos" },
    { role: "Claro", hex: p.light, share: 0.18, use: "Fondos" },
  ];
  let cx0 = M;
  const cwTotal = W - 2 * M;
  const colorCols = colors
    .map((col) => {
      const w = cwTotal * col.share;
      const on = onColor(col.hex, p.dark);
      const svg =
        `<rect x="${cx0}" y="190" width="${w}" height="760" fill="${col.hex}"/>` +
        textSvg(c.fonts.heading, col.role, cx0 + 36, 250, 32, on, { tracking: -0.01 }) +
        textSvg(c.fonts.body, col.use, cx0 + 36, 290, 18, on, { opacity: 0.8 }) +
        [`HEX ${col.hex}`, `RGB ${rgbText(col.hex)}`, `CMYK ${cmykText(col.hex)}`].map((l, i) => textSvg(c.fonts.body, l, cx0 + 36, 846 + i * 32, 18, on)).join("");
      cx0 += w;
      return svg;
    })
    .join("");
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`],
    ["Colores", t.clip(M, 190, cwTotal, 760, colorCols, 32)],
    ["Encabezado", chrome(c, t, n(), "03 · Color")],
  ]);

  // 11. Degradado y fondos + fotos
  const gid = nextId();
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`],
    [
      "Fondos",
      t.title("Fondos y fotos", M, 170, 76).svg +
        t.clip(M, 300, 520, 400, t.backdrop(M, 300, 520, 400, "oscuro")) +
        t.clip(M + 560, 300, 520, 400, t.backdrop(M + 560, 300, 520, 400, "claro")) +
        `<rect x="${M + 560}" y="300" width="520" height="400" rx="28" fill="none" stroke="${mixHex("#FFFFFF", p.dark, 0.1)}" stroke-width="2"/>` +
        `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.primary}"/><stop offset="1" stop-color="${gradientEnd(p)}"/></linearGradient></defs>` +
        `<rect x="${M + 1120}" y="300" width="520" height="400" rx="28" fill="url(#${gid})"/>` +
        t.body("Fondo oscuro", M, 730, 500, 22, t.grey, 1).svg +
        t.body("Fondo claro", M + 560, 730, 500, 22, t.grey, 1).svg +
        t.body(`Degradado ${p.primary} → ${gradientEnd(p)}`, M + 1120, 730, 520, 22, t.grey, 1).svg +
        t.label("Fotos", M, 850) +
        t.body(base.photoStyle, M, 880, 1600, 26, t.ink, 3).svg,
    ],
    ["Encabezado", chrome(c, t, n(), "03 · Color")],
  ]);

  // 12. Tipografía
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`],
    [
      "Tipografía",
      t.card(M, 190, 760, 760, p.light) +
        textSvg(c.fonts.heading, "Aa", M + 60, 640, 420, t.ink, { tracking: -0.05 }) +
        t.head(f.heading.family, M + 60, 820, 44) +
        t.body(`Títulos · Gratis en fonts.google.com`, M + 60, 850, 640, 22, t.grey, 1).svg +
        t.label("Título", 980, 230) +
        t.title(c.kit.slogan, 980, 260, 70, t.ink, 820, 2).svg +
        t.label("Subtítulo", 980, 480) +
        t.title(c.kit.proposition, 980, 510, 36, t.ink, 820, 2).svg +
        t.label(`Texto · ${f.body.family}`, 980, 680) +
        t.body(base.description || c.kit.proposition, 980, 710, 820, 26, t.grey, 5).svg,
    ],
    ["Encabezado", chrome(c, t, n(), "04 · Tipografía")],
  ]);

  // 13. Redes sociales
  const perfil = await perfilArt(c);
  const post = await publicacionArt(c);
  const story = await historiaArt(c);
  const ring = nextId();
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="${p.light}"/>`],
    [
      "Redes",
      t.title("Redes sociales", M, 170, 76).svg +
        `<defs><clipPath id="${ring}"><circle cx="${M + 170}" cy="560" r="170"/></clipPath></defs><g clip-path="url(#${ring})">${place(perfil, M, 390, 340, 340).svg}</g>` +
        t.body("Foto de perfil", M, 770, 340, 22, t.grey, 1).svg +
        t.shadow(560, 300, 600, 600) +
        t.clip(560, 300, 600, 600, place(post, 560, 300, 600, 600).svg, 24) +
        t.body("Publicación", 560, 930, 600, 22, t.grey, 1).svg +
        t.shadow(1300, 220, 380, 676) +
        t.clip(1300, 220, 380, 676, place(story, 1300, 220, 380, 676).svg, 24) +
        t.body("Historia / Estado", 1300, 925, 380, 22, t.grey, 1).svg,
    ],
    ["Encabezado", chrome(c, t, n(), "05 · Redes sociales")],
  ]);

  // 14. Textos listos para redes
  const textCards: [string, string][] = [
    ["Bio para Instagram y Facebook", base.bio],
    ["Descripción para Google y WhatsApp", base.description],
    ["Mensaje de bienvenida de WhatsApp", base.whatsappWelcome],
    ["Hashtags", base.hashtags.join("  ")],
  ];
  const cw2 = (W - 2 * M - 30) / 2;
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`],
    [
      "Textos",
      t.title("Textos listos para usar", M, 170, 76).svg +
        textCards
          .map(([lbl, txt], i) => {
            const x = M + (i % 2) * (cw2 + 30);
            const y = 300 + Math.floor(i / 2) * 330;
            return t.card(x, y, cw2, 300, p.light) + t.label(lbl, x + 48, y + 66) + t.body(txt, x + 48, y + 100, cw2 - 96, 26, t.ink, 5, 1.4).svg;
          })
          .join(""),
    ],
    ["Encabezado", chrome(c, t, n(), "05 · Redes sociales")],
  ]);

  // 15. Ideas de publicaciones y mensajes clave
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>` + t.clip(1160, 0, 760, H, t.backdrop(1160, 0, 760, H, "oscuro"), 0)],
    [
      "Ideas",
      t.title("Ideas para publicar", M, 170, 76, t.ink, 900).svg +
        base.postIdeas
          .slice(0, 5)
          .map((idea, i) => t.head(String(i + 1).padStart(2, "0"), M, 360 + i * 120, 30, t.accentText) + t.body(idea, M + 80, 336 + i * 120, 860, 26, t.ink, 2, 1.3).svg)
          .join("") +
        t.label("Mensajes clave", 1260, 300, "#FFFFFF") +
        base.messages
          .slice(0, 3)
          .map((msg, i) => t.title(msg, 1260, 350 + i * 200, 40, "#FFFFFF", 540, 3).svg)
          .join(""),
    ],
    ["Encabezado", chrome(c, t, n(), "05 · Redes sociales")],
  ]);

  // 16. Papelería
  const [front, back] = await tarjetaArts(c);
  const memb = await membreteArt(c);
  const cot = await cotizacionArt(c);
  const card = (art: Art, x: number, y: number, w: number) => {
    const h = (art.height * w) / art.width;
    return t.shadow(x, y, w, h) + t.clip(x, y, w, h, place(art, x, y, w, h).svg, 12);
  };
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="${p.light}"/>`],
    [
      "Papelería",
      t.title("Papelería", M, 170, 76).svg +
        card(front, M, 300, 560) +
        card(back, M + 120, 640, 560) +
        card(memb, 900, 230, 420) +
        card(cot, 1380, 230, 420) +
        t.body("Tarjeta 9 × 5 cm (PDF listo para imprenta) · Hoja membretada (PDF y Word) · Cotización", 900, 820, 900, 22, t.grey, 2).svg,
    ],
    ["Encabezado", chrome(c, t, n(), "06 · Papelería")],
  ]);

  // 17. Volante y WhatsApp
  const flyer = await volanteArt(c);
  const chat = await chatArt(c, base.whatsappWelcome);
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`],
    [
      "Volante",
      t.title("Volante y WhatsApp", M, 170, 76, t.ink, 700).svg +
        t.body("El volante lleva tus productos y precios. El chat muestra cómo se ve tu negocio al escribirte.", M, 400, 600, 28, t.grey, 4).svg +
        card(flyer, 800, 160, 600) +
        (() => {
          const pl = place(chat, 1440, 150, 400, 780);
          return t.shadow(pl.x, pl.y, pl.w, pl.h) + t.clip(pl.x, pl.y, pl.w, pl.h, pl.svg, 24);
        })(),
    ],
    ["Encabezado", chrome(c, t, n(), "06 · Papelería")],
  ]);

  // 18. Aplicaciones
  const apps = [await letreroArt(c), await camisetaArt(c), await bolsaArt(c), await vehiculoArt(c)];
  const aw = (W - 2 * M - 30) / 2;
  const ah = 380;
  add([
    ["Fondo", `<rect width="${W}" height="${H}" fill="#FFFFFF"/>`],
    [
      "Aplicaciones",
      apps
        .map((art, i) => {
          const x = M + (i % 2) * (aw + 30);
          const y = 150 + Math.floor(i / 2) * (ah + 30);
          const k = Math.max(aw / art.width, ah / art.height);
          const w = art.width * k;
          const h = art.height * k;
          return t.clip(x, y, aw, ah, place(art, x + (aw - w) / 2, y + (ah - h) / 2, w, h).svg);
        })
        .join(""),
    ],
    ["Encabezado", chrome(c, t, n(), "07 · Aplicaciones")],
  ]);

  // 19. Contraportada
  add([
    ["Fondo", backdropSvg(c.kit, W, H, "oscuro")],
    [
      "Cierre",
      place(await logo("isotipo", "blanco"), W / 2 - 90, 280, 180, 180).svg +
        paragraphSvg(c.fonts.heading, c.kit.slogan, W / 2, 540, 1200, 64, "#FFFFFF", { anchor: "middle", maxLines: 2, lineHeight: 1.02, tracking: TITLE }).svg +
        textSvg(c.fonts.body, [c.phone, c.siteUrl?.replace(/^https?:\/\//, "")].filter(Boolean).join("   ·   "), W / 2, 820, 24, "#FFFFFF", { anchor: "middle", opacity: 0.85 }) +
        textSvg(c.fonts.body, "Manual hecho con Orbusiness", W / 2, H - 60, 16, "#FFFFFF", { anchor: "middle", opacity: 0.6, tracking: 0.1 }),
    ],
  ]);

  return pages;
}
