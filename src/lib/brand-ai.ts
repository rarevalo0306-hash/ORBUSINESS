import "server-only";
import { z } from "zod";
import { FONT_PAIRS, iconsFor, palettesFor, rulesKits, sanitizeKit, type BrandKit } from "@/lib/brand";
import type { Tables } from "@/lib/database.types";
import { marketContext, marketFor } from "@/lib/markets";
import { aiJson } from "@/lib/nuna";

const KitSchema = z.object({
  name: z.string(),
  concept: z.string(),
  proposition: z.string(),
  personality: z.array(z.string()),
  tone: z.string(),
  slogan: z.string(),
  palette: z.string(),
  fonts: z.string(),
  icon: z.string(),
  shape: z.enum(["circle", "rounded", "hexagon", "none"]),
  monogram: z.boolean(),
});
const KitsSchema = z.object({ kits: z.array(KitSchema) });

// Nuna propone 3 kits de marca distintos. Elige solo entre las piezas curadas
// (paletas, tipografías, íconos); el texto (propuesta, tono, eslogan) lo escribe a la medida.
export async function proposeKits(b: Tables<"businesses">, services: { name: string }[]): Promise<BrandKit[]> {
  const fallback = rulesKits(b);
  const palettes = palettesFor(b.industry).slice(0, 8);
  const icons = iconsFor(b.industry).slice(0, 10);
  const form = { tu: "tú", usted: "usted", vos: "vos" }[b.address_form ?? "tu"] ?? "tú";

  const out = await aiJson({
    system:
      "Eres Nuna, diseñadora de marcas de Orbusiness para negocios pequeños de Latinoamérica y EE.UU. " +
      "Propón 3 identidades de marca claramente distintas entre sí (por ejemplo: una fuerte, una moderna y una cercana) " +
      "que le gusten al dueño y a sus clientes locales. Escribe en español natural del país del negocio. " +
      `El eslogan va dirigido a los clientes y usa el trato de ${form}; máximo 7 palabras, sin comillas. ` +
      "Elige paleta, tipografías e ícono SOLO de las listas dadas (usa los id exactos). " +
      "monogram=true significa usar las iniciales del negocio en vez del ícono.",
    user: [
      `Negocio: ${b.name}. Giro: ${b.industry ?? "sin dato"}. Tipo: ${b.business_type ?? "sin dato"}.`,
      `Zona: ${b.zone ?? ""}. ${marketContext(marketFor(b.country_code))}`,
      `Lo que ofrece: ${services.map((s) => s.name).join(", ") || "sin dato"}.`,
      `Entregas a domicilio: ${b.offers_delivery ? "sí" : "no"}. Formas de pago: ${b.payment_methods.join(", ") || "sin dato"}.`,
      `Cómo le llegan clientes: ${b.lead_sources ?? "sin dato"}.`,
      "",
      `Paletas (id: nombre): ${palettes.map((p) => `${p.id}: ${p.name}`).join("; ")}.`,
      `Tipografías (id: estilo): ${FONT_PAIRS.map((f) => `${f.id}: ${f.mood}`).join("; ")}.`,
      `Íconos (id): ${icons.join(", ")}.`,
      "Formas del isotipo: circle, rounded, hexagon, none.",
    ].join("\n"),
    schema: KitsSchema,
    jsonHint:
      'Formato: {"kits": [{"name": "nombre corto de la propuesta", "concept": "por qué funciona (1-2 oraciones)", ' +
      '"proposition": "propuesta de valor (1 oración)", "personality": ["3 adjetivos"], "tone": "tono de voz (1 oración)", ' +
      '"slogan": "eslogan", "palette": "id", "fonts": "id", "icon": "id", "shape": "circle", "monogram": false}, ...] } con exactamente 3 kits.',
  });

  if (!out?.kits?.length) return fallback;
  const kits = out.kits.slice(0, 3).map((k, i) => sanitizeKit(k, fallback[i] ?? fallback[0]));
  while (kits.length < 3) kits.push(fallback[kits.length]);
  return kits;
}
