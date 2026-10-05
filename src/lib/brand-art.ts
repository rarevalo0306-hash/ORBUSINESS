import "server-only";
import { gradientEnd, kitPalette, mixHex, onColor, patternTile, type BrandKit } from "@/lib/brand";
import { capRatio, logoArt, measure, paragraphSvg, place, textSvg, type Art, type KitFonts, type Layer } from "@/lib/brand-render";
import { priceLabel } from "@/lib/interview";
import { say, type AddressForm } from "@/lib/markets";

// Piezas del kit de marca armadas con el logo, los colores, las letras y el patrón:
// redes sociales, papelería (para imprenta) y mockups (cómo se ve la marca en la vida real).
// Cada pieza tiene capas con nombre, para entregarla también como PSD de Photoshop.

export type BrandCtx = {
  kit: BrandKit;
  fonts: KitFonts;
  name: string;
  owner: string | null;
  phone: string | null;
  address: string | null;
  zone: string | null;
  industry: string | null;
  form: AddressForm;
  paymentMethods: string[];
  services: { name: string; price: number | null }[];
  currency: string;
  siteUrl: string | null;
};

const site = (c: BrandCtx) => c.siteUrl?.replace(/^https?:\/\//, "") ?? null;

// ---------- Ayudas ----------

let gradientCount = 0;
function gradientFill(c: BrandCtx, angle: "diag" | "down" = "diag") {
  const p = kitPalette(c.kit);
  const id = `g${++gradientCount}`;
  const [x2, y2] = angle === "diag" ? [1, 1] : [0, 1];
  return {
    id,
    defs: `<defs><linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${p.primary}"/><stop offset="1" stop-color="${gradientEnd(p)}"/></linearGradient></defs>`,
  };
}

function gradientRect(c: BrandCtx, x: number, y: number, w: number, h: number, angle: "diag" | "down" = "diag", rx = 0) {
  const g = gradientFill(c, angle);
  return `${g.defs}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#${g.id})"/>`;
}

// Patrón repetido sobre un área (mosaicos explícitos: funciona igual en PNG, PDF y PSD).
function patternArea(c: BrandCtx, x: number, y: number, w: number, h: number, color: string, opacity: number, tile: number) {
  const t = patternTile(c.kit, tile, color);
  let out = "";
  for (let ty = y; ty < y + h; ty += tile) {
    for (let tx = x; tx < x + w; tx += tile) out += `<g transform="translate(${tx} ${ty})">${t}</g>`;
  }
  return `<g opacity="${opacity}">${out}</g>`;
}

const rect = (x: number, y: number, w: number, h: number, fill: string, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`;

const logo = (c: BrandCtx, variant: Parameters<typeof logoArt>[2], theme: Parameters<typeof logoArt>[3]) =>
  logoArt(c.kit, c.name, variant, theme, c.fonts);

const t3 = (c: BrandCtx, p: { tu: string; usted: string; vos: string }) => say(c.form, p);

// ---------- Redes sociales ----------

export async function perfilArt(c: BrandCtx): Promise<Art> {
  const p = kitPalette(c.kit);
  const S = 1000;
  if (c.kit.layout === "emblema") {
    return {
      width: S,
      height: S,
      layers: [
        { name: "Fondo", svg: rect(0, 0, S, S, p.light) },
        { name: "Logo", svg: place(await logo(c, "principal", "color"), 110, 110, 780, 780).svg },
      ],
    };
  }
  return {
    width: S,
    height: S,
    layers: [
      { name: "Fondo", svg: gradientRect(c, 0, 0, S, S) },
      { name: "Símbolo", svg: place(await logo(c, "isotipo", "blanco"), 230, 230, 540, 540).svg },
    ],
  };
}

export async function portadaArt(c: BrandCtx): Promise<Art> {
  const W = 1640;
  const H = 624;
  const slogan = paragraphSvg(c.fonts.heading, c.kit.slogan, 960, 0, 580, 64, "#FFFFFF", { maxLines: 3 });
  const top = (H - slogan.height) / 2;
  return {
    width: W,
    height: H,
    layers: [
      { name: "Fondo", svg: gradientRect(c, 0, 0, W, H) },
      { name: "Patrón", svg: patternArea(c, 0, 0, W, H, "#FFFFFF", 0.1, 96) },
      { name: "Logo", svg: place(await logo(c, "principal", "blanco"), 110, 150, 760, 324).svg },
      { name: "Eslogan", svg: paragraphSvg(c.fonts.heading, c.kit.slogan, 960, top, 580, 64, "#FFFFFF", { maxLines: 3 }).svg },
    ],
  };
}

export async function publicacionArt(c: BrandCtx): Promise<Art> {
  const p = kitPalette(c.kit);
  const S = 1080;
  const g = gradientFill(c);
  const slogan = paragraphSvg(c.fonts.heading, c.kit.slogan, 90, 0, 900, 112, p.primary, { maxLines: 4, lineHeight: 1.08 });
  const top = S / 2 - slogan.height / 2 + 10;
  return {
    width: S,
    height: S,
    layers: [
      { name: "Fondo", svg: rect(0, 0, S, S, p.light) },
      { name: "Patrón", svg: patternArea(c, 0, 0, S, S, p.primary, 0.07, 108) },
      { name: "Logo", svg: place(await logo(c, "principal", "color"), 90, 80, 560, 170, "start").svg },
      { name: "Eslogan", svg: paragraphSvg(c.fonts.heading, c.kit.slogan, 90, top, 900, 112, p.primary, { maxLines: 4, lineHeight: 1.08 }).svg },
      {
        name: "Datos",
        svg: `${g.defs}<rect x="90" y="900" width="200" height="16" rx="8" fill="url(#${g.id})"/>${textSvg(c.fonts.body, [c.zone, c.phone].filter(Boolean).join("  ·  "), 90, 990, 38, p.dark)}`,
      },
    ],
  };
}

export async function historiaArt(c: BrandCtx): Promise<Art> {
  const p = kitPalette(c.kit);
  const W = 1080;
  const H = 1920;
  const slogan = paragraphSvg(c.fonts.heading, c.kit.slogan, W / 2, 0, 900, 124, "#FFFFFF", { anchor: "middle", maxLines: 4, lineHeight: 1.08 });
  const top = 980 - slogan.height / 2;
  const cta = t3(c, { tu: "Escríbenos por WhatsApp", usted: "Escríbanos por WhatsApp", vos: "Escribinos por WhatsApp" });
  return {
    width: W,
    height: H,
    layers: [
      { name: "Fondo", svg: gradientRect(c, 0, 0, W, H, "down") },
      { name: "Patrón", svg: patternArea(c, 0, 0, W, H, "#FFFFFF", 0.1, 120) },
      { name: "Logo", svg: place(await logo(c, "principal", "blanco"), 160, 200, 760, 360).svg },
      { name: "Eslogan", svg: paragraphSvg(c.fonts.heading, c.kit.slogan, W / 2, top, 900, 124, "#FFFFFF", { anchor: "middle", maxLines: 4, lineHeight: 1.08 }).svg },
      {
        name: "Botón",
        svg:
          `<rect x="140" y="1500" width="800" height="124" rx="62" fill="#FFFFFF"/>` +
          textSvg(c.fonts.body, cta, W / 2, 1562 + (capRatio(c.fonts.body) * 44) / 2, 44, p.primary, { anchor: "middle" }) +
          (c.phone ? textSvg(c.fonts.body, c.phone, W / 2, 1720, 46, "#FFFFFF", { anchor: "middle" }) : ""),
      },
    ],
  };
}

export async function iconoAppArt(c: BrandCtx): Promise<Art> {
  const p = kitPalette(c.kit);
  const S = 1024;
  const mark = await logoArt({ ...c.kit, shape: "none" }, c.name, "isotipo", "blanco", c.fonts);
  return {
    width: S,
    height: S,
    layers: [
      { name: "Fondo", svg: `<rect width="${S}" height="${S}" rx="228" fill="${p.primary}"/>` },
      { name: "Símbolo", svg: place(mark, 232, 232, 560, 560).svg },
    ],
  };
}

// ---------- Papelería (puntos tipográficos: 72 por pulgada) ----------

const MM = 72 / 25.4;

// Tarjeta de presentación 90 × 50 mm con 3 mm de sangrado por lado (para la imprenta).
export async function tarjetaArts(c: BrandCtx): Promise<Art[]> {
  const p = kitPalette(c.kit);
  const W = 96 * MM;
  const H = 56 * MM;
  const bleed = 3 * MM;
  const x = bleed + 14;
  const lines = [c.phone, c.address, site(c)].filter((v): v is string => Boolean(v));
  let y = H - bleed - 16 - (lines.length - 1) * 11;
  const contact = lines
    .map((l) => {
      const svg = textSvg(c.fonts.body, l.length > 52 ? `${l.slice(0, 50)}…` : l, x, y, 7.2, p.dark);
      y += 11;
      return svg;
    })
    .join("");
  const nameY = H - bleed - 16 - (lines.length - 1) * 11 - 22;
  return [
    {
      width: W,
      height: H,
      layers: [
        { name: "Fondo", svg: gradientRect(c, 0, 0, W, H) },
        { name: "Patrón", svg: patternArea(c, 0, 0, W, H, "#FFFFFF", 0.1, 26) },
        { name: "Logo", svg: place(await logo(c, "principal", "blanco"), 40, 38, W - 80, H - 76).svg },
      ],
    },
    {
      width: W,
      height: H,
      layers: [
        { name: "Fondo", svg: rect(0, 0, W, H, "#FFFFFF") + gradientRect(c, W - bleed - 12, 0, bleed + 12, H, "down") },
        { name: "Logo", svg: place(await logo(c, "principal", "color"), x, bleed + 12, 140, 36, "start").svg },
        {
          name: "Datos",
          svg:
            textSvg(c.fonts.heading, c.owner || c.name, x, nameY, 11, p.dark) +
            (c.owner ? textSvg(c.fonts.body, (c.industry || c.name).toLocaleUpperCase("es"), x, nameY + 10, 6, p.primary, { tracking: 0.12 }) : "") +
            contact,
        },
      ],
    },
  ];
}

async function letterhead(c: BrandCtx): Promise<Layer[]> {
  const p = kitPalette(c.kit);
  const W = 612;
  const lines = [c.phone, c.address, site(c)].filter((v): v is string => Boolean(v));
  const g = gradientFill(c, "diag");
  return [
    { name: "Fondo", svg: rect(0, 0, W, 792, "#FFFFFF") },
    {
      name: "Encabezado",
      svg:
        place(await logo(c, "principal", "color"), 50, 34, 230, 66, "start").svg +
        lines.map((l, i) => textSvg(c.fonts.body, l.length > 60 ? `${l.slice(0, 58)}…` : l, 562, 52 + i * 12, 8.5, p.dark, { anchor: "end" })).join("") +
        `${g.defs}<rect x="50" y="112" width="512" height="3" fill="url(#${g.id})"/>`,
    },
    {
      name: "Pie",
      svg:
        rect(0, 752, W, 40, p.primary) +
        patternArea(c, 0, 752, W, 40, onColor(p.primary, p.dark), 0.12, 20) +
        textSvg(c.fonts.body, [c.kit.slogan, site(c)].filter(Boolean).join("   ·   "), W / 2, 775, 9, onColor(p.primary, p.dark), { anchor: "middle" }),
    },
  ];
}

export async function membreteArt(c: BrandCtx): Promise<Art> {
  return { width: 612, height: 792, layers: await letterhead(c) };
}

export async function cotizacionArt(c: BrandCtx): Promise<Art> {
  const p = kitPalette(c.kit);
  const on = onColor(p.primary, p.dark);
  const b = (t: string, x: number, y: number, size = 9, fill = p.dark, anchor: "start" | "end" | "middle" = "start") =>
    textSvg(c.fonts.body, t, x, y, size, fill, { anchor });
  const line = (x1: number, y: number, x2: number, color = "#C9CDD3") => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${color}" stroke-width="0.8"/>`;
  let table = rect(50, 250, 512, 22, p.primary) + b("Descripción", 58, 264, 9, on) + b("Cant.", 372, 264, 9, on, "end") + b("Precio", 456, 264, 9, on, "end") + b("Total", 554, 264, 9, on, "end");
  for (let i = 1; i <= 12; i++) table += line(50, 272 + i * 22, 562);
  const totals =
    b("Subtotal", 456, 570) + line(470, 572, 562) + b("Descuento", 456, 590) + line(470, 592, 562) + rect(380, 602, 182, 24, p.primary) + b("TOTAL", 456, 618, 10, on, "end");
  const pay = c.paymentMethods.length ? `Formas de pago: ${c.paymentMethods.join(", ")}.` : "";
  return {
    width: 612,
    height: 792,
    layers: [
      ...(await letterhead(c)),
      {
        name: "Cotización",
        svg:
          textSvg(c.fonts.heading, "COTIZACIÓN", 50, 168, 24, p.primary) +
          b("No.", 420, 150) + line(440, 152, 562) + b("Fecha", 420, 168) + line(450, 170, 562) +
          b("Cliente", 50, 206) + line(88, 208, 562) + b("Teléfono", 50, 228) + line(94, 230, 300) + b("Correo", 310, 228) + line(342, 230, 562) +
          table + totals +
          b(`Precios en ${c.currency}.`, 50, 660, 8, "#555B63") +
          (pay ? b(pay, 50, 674, 8, "#555B63") : "") +
          b("Cotización válida por 15 días.", 50, 688, 8, "#555B63"),
      },
    ],
  };
}

export async function volanteArt(c: BrandCtx): Promise<Art> {
  const p = kitPalette(c.kit);
  const W = 612;
  const H = 792;
  const on = onColor(p.primary, p.dark);
  const list = c.services.slice(0, 10);
  const items = list
    .map((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 50 + col * 266;
      const y = 532 + row * 30;
      const name = s.name.length > 30 ? `${s.name.slice(0, 28)}…` : s.name;
      return textSvg(c.fonts.body, name, x, y, 11.5, p.dark) + (s.price != null ? textSvg(c.fonts.body, priceLabel(s.price, c.currency), x + 246, y, 11.5, p.primary, { anchor: "end" }) : "");
    })
    .join("");
  const cta = t3(c, { tu: "Escríbenos por WhatsApp", usted: "Escríbanos por WhatsApp", vos: "Escribinos por WhatsApp" });
  return {
    width: W,
    height: H,
    layers: [
      { name: "Fondo", svg: rect(0, 0, W, H, "#FFFFFF") + gradientRect(c, 0, 0, W, 450) },
      { name: "Patrón", svg: patternArea(c, 0, 0, W, 450, "#FFFFFF", 0.1, 40) },
      { name: "Logo", svg: place(await logo(c, "principal", "blanco"), 106, 44, 400, 170).svg },
      { name: "Eslogan", svg: paragraphSvg(c.fonts.heading, c.kit.slogan, W / 2, 262, 500, 34, "#FFFFFF", { anchor: "middle", maxLines: 3 }).svg },
      {
        name: "Lo que ofrecemos",
        svg: list.length ? textSvg(c.fonts.heading, "Lo que ofrecemos", 50, 498, 18, p.primary) + items : textSvg(c.fonts.heading, c.kit.proposition.slice(0, 70), W / 2, 560, 14, p.dark, { anchor: "middle" }),
      },
      {
        name: "Contacto",
        svg:
          rect(0, 712, W, 80, p.primary) +
          textSvg(c.fonts.heading, c.phone ? `${cta}: ${c.phone}` : cta, 50, 746, 13, on) +
          (c.address ? textSvg(c.fonts.body, c.address.length > 80 ? `${c.address.slice(0, 78)}…` : c.address, 50, 766, 9, on) : "") +
          place(await logoArt({ ...c.kit, shape: "none" }, c.name, "isotipo", "blanco", c.fonts), 510, 722, 60, 60).svg,
      },
    ],
  };
}

// ---------- Mockups ----------

export async function letreroArt(c: BrandCtx): Promise<Art> {
  const p = kitPalette(c.kit);
  const W = 1600;
  const H = 1000;
  let awning = "";
  const n = 12;
  const sw = 1160 / n;
  for (let i = 0; i < n; i++) {
    const x = 220 + i * sw;
    const fill = i % 2 ? "#FFFFFF" : p.primary;
    awning += `<path d="M${x} 430 H${x + sw} V500 A${sw / 2} ${sw / 3} 0 0 1 ${x} 500 Z" fill="${fill}"/>`;
  }
  const glass = (x: number, w: number) =>
    rect(x, 570, w, 250, "#33404E") + `<path d="M${x + 30} 820 L${x + 150} 570 H${x + 200} L${x + 80} 820 Z" fill="#FFFFFF" fill-opacity="0.08"/>`;
  return {
    width: W,
    height: H,
    layers: [
      { name: "Fondo", svg: rect(0, 0, W, H, "#E6E2DA") + rect(0, 900, W, 100, "#B9B3A8") + rect(150, 120, 1300, 780, "#F7F5F1") },
      { name: "Letrero", svg: `<rect x="220" y="160" width="1160" height="240" rx="18" fill="${p.primary}"/>` + place(await logo(c, "principal", "blanco"), 270, 180, 1060, 200).svg },
      { name: "Toldo", svg: awning },
      {
        name: "Fachada",
        svg:
          glass(260, 360) +
          glass(980, 360) +
          rect(690, 560, 220, 340, "#2B3440") +
          rect(708, 580, 184, 300, "#3A4654") +
          `<circle cx="868" cy="740" r="7" fill="#C8CCD2"/>` +
          place(await logoArt({ ...c.kit, shape: "none" }, c.name, "isotipo", "blanco", c.fonts), 400, 640, 80, 80).svg,
      },
    ],
  };
}

export async function camisetaArt(c: BrandCtx): Promise<Art> {
  const p = kitPalette(c.kit);
  const shirt = p.primary;
  const shade = mixHex(shirt, "#000000", 0.25);
  return {
    width: 1200,
    height: 1200,
    layers: [
      { name: "Fondo", svg: rect(0, 0, 1200, 1200, p.light) },
      {
        name: "Camiseta",
        svg:
          `<path d="M420 170 L250 240 L120 420 L250 520 L330 450 L330 1050 L870 1050 L870 450 L950 520 L1080 420 L950 240 L780 170 C740 250 670 290 600 290 C530 290 460 250 420 170 Z" fill="${shirt}"/>` +
          `<path d="M420 170 C460 250 530 290 600 290 C670 290 740 250 780 170 L745 160 C705 228 655 254 600 254 C545 254 495 228 455 160 Z" fill="${shade}"/>` +
          `<path d="M330 450 L330 520 M870 450 L870 520" stroke="${shade}" stroke-width="6"/>`,
      },
      { name: "Logo", svg: place(await logo(c, c.kit.layout === "emblema" ? "principal" : "vertical", "blanco"), 440, 380, 320, 260).svg },
    ],
  };
}

export async function bolsaArt(c: BrandCtx): Promise<Art> {
  const p = kitPalette(c.kit);
  return {
    width: 1200,
    height: 1200,
    layers: [
      { name: "Fondo", svg: rect(0, 0, 1200, 1200, "#ECE9E4") + `<ellipse cx="640" cy="1080" rx="380" ry="34" fill="#000000" fill-opacity="0.08"/>` },
      {
        name: "Bolsa",
        svg:
          `<path d="M870 400 L950 440 L950 1020 L870 1060 Z" fill="#E2DED6"/>` +
          `<rect x="330" y="400" width="540" height="660" fill="#FFFFFF" stroke="#D9D4CC" stroke-width="3"/>` +
          `<path d="M470 400 C470 220 730 220 730 400" fill="none" stroke="${p.primary}" stroke-width="18" stroke-linecap="round"/>` +
          rect(330, 960, 540, 100, p.primary) +
          patternArea(c, 330, 960, 540, 100, onColor(p.primary, p.dark), 0.15, 50),
      },
      { name: "Logo", svg: place(await logo(c, c.kit.layout === "palabra" || c.kit.layout === "clasico" ? "vertical" : "principal", "color"), 380, 520, 440, 360).svg },
    ],
  };
}

export async function vehiculoArt(c: BrandCtx): Promise<Art> {
  const p = kitPalette(c.kit);
  const on = onColor(p.primary, p.dark);
  const wheel = (x: number) => `<circle cx="${x}" cy="712" r="86" fill="#1F2328"/><circle cx="${x}" cy="712" r="38" fill="#9AA1A9"/>`;
  return {
    width: 1600,
    height: 900,
    layers: [
      { name: "Fondo", svg: rect(0, 0, 1600, 900, "#EEF1F4") + `<ellipse cx="815" cy="800" rx="680" ry="34" fill="#000000" fill-opacity="0.1"/>` },
      {
        name: "Vehículo",
        svg:
          `<rect x="200" y="250" width="960" height="460" rx="30" fill="#FFFFFF" stroke="#D5D9DE" stroke-width="3"/>` +
          `<path d="M1150 320 L1300 320 Q1345 320 1370 360 L1425 465 Q1435 488 1435 520 L1435 710 L1150 710 Z" fill="#FFFFFF" stroke="#D5D9DE" stroke-width="3"/>` +
          `<path d="M1180 350 L1290 350 Q1315 350 1330 375 L1385 475 L1180 475 Z" fill="#3A4654"/>` +
          rect(200, 580, 1235, 56, p.primary) +
          (c.phone ? textSvg(c.fonts.body, c.phone, 250, 618, 32, on) : "") +
          rect(1420, 650, 30, 40, "#D5D9DE") +
          wheel(430) +
          wheel(1250),
      },
      { name: "Logo", svg: place(await logo(c, "principal", "color"), 250, 290, 860, 260).svg },
    ],
  };
}

export async function chatArt(c: BrandCtx, welcome: string): Promise<Art> {
  const p = kitPalette(c.kit);
  const on = onColor(p.primary, p.dark);
  const msg = paragraphSvg(c.fonts.body, welcome, 250, 560, 470, 27, p.dark, { maxLines: 7, lineHeight: 1.3 });
  const hello = t3(c, { tu: "Hola, ¿tienen disponible?", usted: "Buenas, ¿tienen disponible?", vos: "Hola, ¿tienen disponible?" });
  const helloW = measure(c.fonts.body, hello, 27);
  return {
    width: 1000,
    height: 1500,
    layers: [
      { name: "Fondo", svg: rect(0, 0, 1000, 1500, "#E9EDF0") + `<rect x="170" y="60" width="660" height="1380" rx="72" fill="#111111"/>` },
      {
        name: "Pantalla",
        svg:
          `<defs><clipPath id="screen"><rect x="195" y="120" width="610" height="1260" rx="34"/></clipPath></defs>` +
          `<g clip-path="url(#screen)">${rect(195, 120, 610, 1260, p.light)}${patternArea(c, 195, 250, 610, 1130, p.primary, 0.05, 80)}${rect(195, 120, 610, 130, p.primary)}</g>`,
      },
      {
        name: "Perfil",
        svg:
          `<circle cx="262" cy="185" r="44" fill="#FFFFFF"/>` +
          place(await logo(c, "isotipo", "color"), 228, 151, 68, 68).svg +
          textSvg(c.fonts.heading, c.name.length > 22 ? `${c.name.slice(0, 20)}…` : c.name, 326, 182, 28, on) +
          textSvg(c.fonts.body, "en línea", 326, 216, 20, on, { opacity: 0.8 }),
      },
      {
        name: "Mensajes",
        svg:
          `<rect x="${760 - helloW - 40}" y="320" width="${helloW + 40}" height="64" rx="18" fill="${mixHex(p.primary, "#FFFFFF", 0.82)}"/>` +
          textSvg(c.fonts.body, hello, 760 - 20, 362, 27, p.dark, { anchor: "end" }) +
          `<rect x="230" y="530" width="520" height="${msg.height + 64}" rx="18" fill="#FFFFFF"/>` +
          msg.svg,
      },
    ],
  };
}
