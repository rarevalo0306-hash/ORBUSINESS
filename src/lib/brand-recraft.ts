import "server-only";
import sharp from "sharp";
import { sanitizeSvgFragment } from "@/lib/brand-svg";

// Recraft (recraft.ai) dibuja el símbolo de cada marca en vector real (SVG). Nuna le da el encargo
// (la idea del símbolo y los colores); el nombre lo pone nuestro sistema con tipografía profesional,
// porque las IA de imágenes se equivocan con las letras. Sin RECRAFT_API_KEY se usan los símbolos
// geométricos de siempre.

const API = `${process.env.RECRAFT_BASE_URL?.trim() || "https://external.api.recraft.ai/v1"}/images/generations`;
export const recraftEnabled = () => Boolean(process.env.RECRAFT_API_KEY?.trim());
const model = () => process.env.RECRAFT_MODEL?.trim() || "recraftv4_1_vector";


// Encargo de diseño para la IA (en inglés: así entiende mejor el estilo).
export function symbolPrompt(idea: string, industry: string | null) {
  return (
    `Professional minimalist logomark, symbol only, for a ${industry || "small local business"} brand. Concept: ${idea}. ` +
    "Flat vector logo, bold simple geometric shapes, clever negative space, 2 or 3 solid flat colors, perfectly centered on a plain white background, " +
    "balanced, memorable and iconic, readable at very small sizes, world-class brand identity design in the spirit of Pentagram and Chermayeff & Geismar. " +
    "Absolutely no text, letters, words or numbers; no 3d, no shadows, no gradients, no mockup, no frame, no tiny details."
  );
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function luminanceOf(color: string) {
  let r = 0;
  let g = 0;
  let b = 0;
  const c = color.trim().toLowerCase();
  if (c === "white") return 1;
  if (/^#[0-9a-f]{3}$/.test(c)) [r, g, b] = [1, 2, 3].map((i) => parseInt(c[i] + c[i], 16));
  else if (/^#[0-9a-f]{6}/.test(c)) [r, g, b] = rgb(c);
  else {
    const m = c.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
    if (!m) return 0;
    [r, g, b] = [m[1], m[2], m[3]].map(Number);
  }
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// Quita el fondo: las figuras casi blancas (el fondo y los brillos) se vuelven transparentes.
const removeWhites = (svg: string) =>
  svg.replace(/<(path|rect|circle|ellipse|polygon|polyline)\b[^>]*\bfill="([^"]+)"[^>]*\/>/g, (el, _t, fill: string) =>
    fill.startsWith("url(") || luminanceOf(fill) < 0.93 ? el : "",
  );

let counter = 0;

// SVG de Recraft → símbolo limpio, sin fondo, centrado en un cuadro de 100 × 100.
export async function normalizeSymbol(svgText: string): Promise<string | null> {
  const vb = svgText.match(/viewBox\s*=\s*["']\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  const w0 = Number(svgText.match(/<svg[^>]*\swidth="([\d.]+)/)?.[1] ?? 1024);
  const h0 = Number(svgText.match(/<svg[^>]*\sheight="([\d.]+)/)?.[1] ?? 1024);
  const [vx, vy, vw, vh] = vb ? vb.slice(1, 5).map(Number) : [0, 0, w0, h0];
  if (!(vw > 0 && vh > 0)) return null;
  const prefix = `ai${Date.now().toString(36)}${(counter++).toString(36)}-`;
  const frag = removeWhites(sanitizeSvgFragment(svgText, prefix));
  if (!frag) return null;

  // Caja real del dibujo (sin márgenes): se rasteriza y se buscan los píxeles visibles.
  const R = 400;
  const scale = R / Math.max(vw, vh);
  const W = Math.round(vw * scale);
  const H = Math.round(vh * scale);
  const probe = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" width="${W}" height="${H}">${frag}</svg>`;
  const { data, info } = await sharp(Buffer.from(probe)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let [minX, minY, maxX, maxY] = [info.width, info.height, -1, -1];
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0 || maxX - minX < 8 || maxY - minY < 8) return null;
  const bx = vx + minX / scale;
  const by = vy + minY / scale;
  const bw = (maxX - minX + 1) / scale;
  const bh = (maxY - minY + 1) / scale;
  const k = 96 / Math.max(bw, bh);
  const tx = 50 - (bx + bw / 2) * k;
  const ty = 50 - (by + bh / 2) * k;
  const out = `<g transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(6)})">${frag}</g>`;
  return sanitizeSvgFragment(out) || null;
}

// Pide n símbolos (1 a 6). Devuelve los que salieron bien (puede ser menos de n).
export async function drawSymbols(opts: { idea: string; industry: string | null; colors: string[]; n: number }): Promise<string[]> {
  const key = process.env.RECRAFT_API_KEY?.trim();
  if (!key) return [];
  const body = {
    prompt: symbolPrompt(opts.idea, opts.industry),
    model: model(),
    size: "1:1",
    n: Math.max(1, Math.min(6, opts.n)),
    controls: { colors: opts.colors.slice(0, 4).map((c) => ({ rgb: rgb(c) })), background_color: { rgb: [255, 255, 255] } },
  };
  const call = (b: object) =>
    fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(b),
      signal: AbortSignal.timeout(100_000),
    });
  try {
    // Si Recraft pide esperar (demasiados pedidos seguidos), se reintenta con pausas.
    let res = await call(body);
    for (const wait of [3000, 7000, 12000]) {
      if (res.status !== 429) break;
      await new Promise((r) => setTimeout(r, wait));
      res = await call(body);
    }
    if (res.status === 400 || res.status === 422) {
      // Si el modelo no acepta los colores, se pide sin ellos (los colores se ajustan después).
      console.error("Recraft rechazó el pedido:", (await res.text()).slice(0, 300));
      res = await call({ prompt: body.prompt, model: body.model, size: body.size, n: body.n });
    }
    if (!res.ok) {
      console.error("Recraft respondió", res.status, (await res.text()).slice(0, 300));
      return [];
    }
    const json = (await res.json()) as { data?: { url?: string; b64_json?: string }[] };
    const out: string[] = [];
    for (const item of json.data ?? []) {
      const svg = item.url
        ? await (await fetch(item.url, { signal: AbortSignal.timeout(30_000) })).text()
        : item.b64_json
          ? Buffer.from(item.b64_json, "base64").toString("utf8")
          : "";
      if (!svg.includes("<svg")) continue;
      const symbol = await normalizeSymbol(svg);
      if (symbol) out.push(symbol);
    }
    return out;
  } catch (error) {
    console.error("Recraft falló:", error);
    return [];
  }
}
