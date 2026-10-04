// Guion de la entrevista de reconocimiento y lectura de respuestas con reglas simples.
// Nuna (lib/nuna.ts) usa Claude cuando hay ANTHROPIC_API_KEY; si no, usa estas reglas.

import type { Database } from "@/lib/database.types";

export type BusinessPatch = Database["public"]["Tables"]["businesses"]["Update"];
export type ServiceInput = { name: string; price: number };

export type QuestionKey =
  | "name"
  | "owner"
  | "industry"
  | "services"
  | "zone"
  | "hours"
  | "lead_sources"
  | "visit_before_quote"
  | "payment_timing"
  | "has_recurring_clients"
  | "quote_requires_approval";

export type Question = { key: QuestionKey; text: string; example: string; hint: string };

export const QUESTIONS: Question[] = [
  {
    key: "name",
    text: "¡Hola! Soy Nuna, de Orbusiness. Tú cuéntame de tu negocio y yo armo todo. ¿Cómo se llama tu negocio?",
    example: "Jardines Ricardo",
    hint: "El nombre comercial del negocio.",
  },
  {
    key: "owner",
    text: "¿Y tú cómo te llamas?",
    example: "Me llamo Ricardo",
    hint: "El nombre de pila del dueño o representante.",
  },
  {
    key: "industry",
    text: "¿A qué se dedica el negocio?",
    example: "Jardinería",
    hint: "El giro en pocas palabras (jardinería, limpieza, salón de belleza…).",
  },
  {
    key: "services",
    text: "¿Qué servicios das y cuánto cobras? Escríbelos como te salga, por ejemplo: corte de pasto 45, poda 80.",
    example: "Corte de pasto 45, poda de árboles 80, limpieza de jardín 60, instalación de riego 300",
    hint: "Lista de servicios, cada uno con su precio en dólares.",
  },
  {
    key: "zone",
    text: "¿En qué zona trabajas?",
    example: "Zona norte",
    hint: "La ciudad, colonia o zona donde da servicio.",
  },
  {
    key: "hours",
    text: "¿Qué días y horas trabajas?",
    example: "Lunes a sábado de 8:00 a 17:00",
    hint: "Días y horario de trabajo.",
  },
  {
    key: "lead_sources",
    text: "Ahora cuéntame cómo trabajas, así armo tu CRM a tu medida. ¿Cómo te llegan normalmente los clientes nuevos?",
    example: "Me llaman o me escriben por Facebook, y muchos por recomendación",
    hint: "Por dónde llegan los clientes nuevos.",
  },
  {
    key: "visit_before_quote",
    text: "¿Vas a ver el trabajo antes de dar precio, o cotizas directo?",
    example: "Primero voy a ver el jardín y luego cotizo",
    hint: "Sí = visita antes de cotizar. No = cotiza directo.",
  },
  {
    key: "payment_timing",
    text: "¿Cuándo cobras: antes de empezar, con anticipo, o cuando terminas?",
    example: "Cobro cuando termino el trabajo",
    hint: "before = antes de empezar, deposit = anticipo, after = al terminar.",
  },
  {
    key: "has_recurring_clients",
    text: "¿Tienes clientes que repiten cada semana o cada mes?",
    example: "Sí, muchos cada dos semanas",
    hint: "Sí o no.",
  },
  {
    key: "quote_requires_approval",
    text: "Última: cuando un cliente pida cotización, ¿quieres revisarla antes de que la mande, o la mando yo sola?",
    example: "Quiero revisarlas yo",
    hint: "Sí = el dueño revisa antes de enviar. No = Nuna las manda sola.",
  },
];

export const CLOSING = (owner: string | null) =>
  `Listo${owner ? `, ${owner}` : ""}. Ya entendí tu negocio y cómo trabajas. Siguiente paso: si tienes logo, fotos o página web, pásamelos; si no, yo me encargo.`;

export function questionIndex(key: string | null): number {
  return QUESTIONS.findIndex((q) => q.key === key);
}

// ---------- utilidades de texto ----------

export function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function words(t: string) {
  return t.split(/[^a-z0-9]+/);
}
function has(t: string, list: string[]) {
  return list.some((w) => t.includes(w));
}
function saysNo(t: string) {
  return words(t).includes("no");
}
function saysYes(t: string) {
  const w = words(t);
  return ["si", "claro", "ok", "dale", "va", "perfecto", "bueno", "sale"].some((x) => w.includes(x));
}
function cap(s: string) {
  const t = s.trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
export function money(n: number) {
  return `$${Number(n).toFixed(2).replace(/\.00$/, "")}`;
}

export function parseServices(text: string): ServiceInput[] {
  return text
    .split(/[,\n;]+/)
    .map((part) => {
      const m = part.trim().match(/^(.*?)[\s:–-]*\$?\s*(\d+(?:\.\d+)?)\s*(dolares|dólares|usd|pesos)?\.?$/i);
      if (!m) return null;
      const name = m[1].trim().replace(/[\s:–-]+$/, "");
      if (!name) return null;
      return { name: cap(name), price: parseFloat(m[2]) };
    })
    .filter((s): s is ServiceInput => s !== null);
}

export function servicesText(list: ServiceInput[]) {
  return list.map((s) => `${s.name} ${money(s.price)}`).join(" · ");
}

// ---------- lectura de respuestas por reglas ----------

export type Extraction =
  | { ok: true; ack: string; patch: BusinessPatch; services?: ServiceInput[] }
  | { ok: false; ack: string };

export function extractWithRules(key: QuestionKey, raw: string): Extraction {
  let text = raw.trim();
  const t = norm(text);
  if (!text) return { ok: false, ack: "¿Me lo repites?" };

  switch (key) {
    case "services": {
      const list = parseServices(text);
      if (!list.length)
        return { ok: false, ack: "No encontré precios. Escríbelos así: corte de pasto 45, poda 80." };
      return { ok: true, ack: `Anoté ${list.length} servicios: ${servicesText(list)}.`, patch: {}, services: list };
    }
    case "visit_before_quote": {
      const v = has(t, ["ver", "visita", "revis", "primero", "voy"]) && !has(t, ["directo"]);
      return {
        ok: true,
        ack: v ? "Entendido: primero visitas y luego cotizas. Yo te agendo esas visitas." : "Entendido: cotizas directo.",
        patch: { visit_before_quote: v },
      };
    }
    case "payment_timing": {
      const v = has(t, ["anticipo", "adelanto", "mitad", "deposito"]) ? "deposit" : has(t, ["antes"]) ? "before" : "after";
      const label = { deposit: "Cobras anticipo y el resto al terminar", before: "Cobras antes de empezar", after: "Cobras al terminar el trabajo" }[v];
      return { ok: true, ack: `${label}. Yo mando el cobro en el momento correcto.`, patch: { payment_timing: v } };
    }
    case "has_recurring_clients": {
      const v = !saysNo(t) && (saysYes(t) || has(t, ["cada", "semana", "mes", "fijo", "repit"]));
      return {
        ok: true,
        ack: v ? "Perfecto, yo les agendo el siguiente servicio solita." : "Entendido.",
        patch: { has_recurring_clients: v },
      };
    }
    case "quote_requires_approval": {
      const v = !(saysNo(t) || t.includes("sola") || t.includes("mandala"));
      return {
        ok: true,
        ack: v ? "Perfecto, te pediré OK antes de mandar cada cotización." : "Perfecto, yo las mando y te aviso.",
        patch: { quote_requires_approval: v },
      };
    }
    case "owner":
      text = cap(text.replace(/^(me llamo|soy|mi nombre es|yo soy)\s+/i, ""));
      return { ok: true, ack: `¡Mucho gusto, ${text}!`, patch: { owner_name: text } };
    case "name":
      text = cap(text.replace(/^(se llama|mi negocio se llama|el negocio se llama|es)\s+/i, ""));
      return { ok: true, ack: `Anotado: ${text}.`, patch: { name: text } };
    case "industry":
      text = cap(text.replace(/^(nos dedicamos a|me dedico a|hacemos|es de)\s+/i, ""));
      return { ok: true, ack: "Entendido.", patch: { industry: text } };
    case "zone":
      return { ok: true, ack: "Anotado.", patch: { zone: text } };
    case "hours":
      return { ok: true, ack: "Perfecto.", patch: { hours: text } };
    case "lead_sources":
      return {
        ok: true,
        ack: "Muy bien: todos esos canales van a llegar a una sola bandeja.",
        patch: { lead_sources: text },
      };
  }
}
