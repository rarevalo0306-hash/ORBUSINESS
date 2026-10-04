// Guion de la entrevista de reconocimiento. Se adapta al tipo de negocio:
// tiendas (productos), servicios, o ambos. Nuna (lib/nuna.ts) usa IA si hay llave;
// si no, o si la IA falla, entiende las respuestas con las reglas de este archivo.

import type { Database } from "@/lib/database.types";

export type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
export type BusinessPatch = Database["public"]["Tables"]["businesses"]["Update"];
export type ServiceInput = { name: string; price: number | null };
export type BusinessType = "products" | "services" | "both";

export type QuestionKey =
  | "name"
  | "owner"
  | "location"
  | "business_type"
  | "industry"
  | "offerings"
  | "hours"
  | "lead_sources"
  | "visit_before_quote"
  | "payment_timing"
  | "offers_delivery"
  | "has_recurring_clients"
  | "quote_requires_approval";

type B = Pick<BusinessRow, "business_type">;
const sells = (b: B) => b.business_type === "products" || b.business_type === "both";
const serves = (b: B) => b.business_type !== "products"; // servicios, ambos, o aún no se sabe

export type Question = {
  key: QuestionKey;
  label: string;
  text: (b: B) => string;
  hint: (b: B) => string;
  applies?: (b: B) => boolean;
};

export const QUESTIONS: Question[] = [
  {
    key: "name",
    label: "Negocio",
    text: () => "¡Hola! Soy Nuna, de Orbusiness. Tú cuéntame de tu negocio y yo armo todo. ¿Cómo se llama tu negocio?",
    hint: () => "Solo el nombre comercial del negocio, sin saludos ni frases (por ejemplo: Ferretería El Martillo).",
  },
  {
    key: "owner",
    label: "Dueño",
    text: () => "¿Y tú cómo te llamas?",
    hint: () => "El nombre de pila del dueño o representante.",
  },
  {
    key: "location",
    label: "Ubicación",
    text: () => "¿En qué país y ciudad está tu negocio?",
    hint: () => "text_value = ciudad o zona; country = nombre del país en español.",
  },
  {
    key: "business_type",
    label: "Tipo de negocio",
    text: () => "¿Vendes productos, das servicios, o las dos cosas?",
    hint: () => "business_type: products (vende artículos, tienda), services (hace trabajos), both (las dos cosas).",
  },
  {
    key: "industry",
    label: "A qué se dedica",
    text: () => "¿A qué se dedica el negocio? Por ejemplo: ferretería, salón de belleza, jardinería, taller mecánico.",
    hint: () => "El giro en pocas palabras.",
  },
  {
    key: "offerings",
    label: "Productos o servicios",
    text: (b) =>
      b.business_type === "products"
        ? "¿Qué tipo de productos vendes? Si quieres, dime el precio de los más pedidos."
        : b.business_type === "both"
          ? "¿Qué productos y servicios ofreces? Si tienes precios, inclúyelos."
          : "¿Qué servicios das y cuánto cobras por cada uno?",
    hint: () =>
      "Lista de productos o categorías de productos y/o servicios. Precio solo si el dueño lo dijo (número en su moneda); si no, null. Si describe la tienda en general, resume en 3 a 6 categorías claras.",
  },
  {
    key: "hours",
    label: "Horario",
    text: () => "¿Qué días y horas abres o trabajas?",
    hint: () => "Días y horario.",
  },
  {
    key: "lead_sources",
    label: "Cómo llegan los clientes",
    text: () =>
      "Ahora cuéntame cómo trabajas, así armo tu CRM a tu medida. ¿Cómo te llegan normalmente los clientes nuevos?",
    hint: () => "Por dónde llegan los clientes nuevos (redes, llamadas, recomendación, pasan por el local…).",
  },
  {
    key: "visit_before_quote",
    label: "Antes de cotizar",
    text: () => "Cuando te piden un trabajo, ¿vas a verlo antes de dar precio, o cotizas directo?",
    hint: () => "bool_value: true si visita o revisa antes de cotizar; false si cotiza directo o no aplica.",
    applies: serves,
  },
  {
    key: "payment_timing",
    label: "Cómo cobra",
    text: (b) =>
      b.business_type === "products"
        ? "¿Cómo te pagan tus clientes: al momento de la compra, con apartado, o a crédito?"
        : b.business_type === "both"
          ? "¿Cómo te pagan: al momento, con anticipo o apartado, al terminar el trabajo, o a crédito?"
          : "¿Cuándo cobras: antes de empezar, con anticipo, o cuando terminas el trabajo?",
    hint: () =>
      "payment_timing: at_sale (paga al momento de la compra), deposit (anticipo o apartado), credit (a crédito o fiado), before (antes de empezar un trabajo), after (al terminar un trabajo). Elige la que más se use.",
  },
  {
    key: "offers_delivery",
    label: "Entregas a domicilio",
    text: () => "¿Haces entregas a domicilio?",
    hint: () => "bool_value: true si entrega a domicilio o hace envíos; false si no.",
    applies: sells,
  },
  {
    key: "has_recurring_clients",
    label: "Clientes frecuentes",
    text: (b) =>
      sells(b)
        ? "¿Tienes clientes que te compran seguido, como contratistas u otros negocios?"
        : "¿Tienes clientes que repiten cada semana o cada mes?",
    hint: () => "bool_value: true si tiene clientes frecuentes o recurrentes.",
  },
  {
    key: "quote_requires_approval",
    label: "Cotizaciones",
    text: () =>
      "Última: cuando un cliente pida precio o cotización, ¿quieres revisarla antes de que la mande, o la mando yo sola?",
    hint: () => "bool_value: true si el dueño quiere revisar antes de enviar; false si Nuna las manda sola.",
  },
];

export const CLOSING = (owner: string | null) =>
  `Listo${owner ? `, ${owner}` : ""}. Ya entendí tu negocio y cómo trabajas. Siguiente paso: si tienes logo, fotos o página web, pásamelos; si no, yo me encargo.`;

export function questionIndex(key: string | null): number {
  return QUESTIONS.findIndex((q) => q.key === key);
}

export function questionFor(key: string | null) {
  return QUESTIONS.find((q) => q.key === key) ?? null;
}

// Siguiente pregunta que aplica a este negocio (o null si ya terminó).
export function nextQuestion(fromIndex: number, b: B): Question | null {
  for (let i = fromIndex + 1; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    if (!q.applies || q.applies(b)) return q;
  }
  return null;
}

// ---------- país y moneda ----------

const COUNTRIES: [string, string, string][] = [
  // [palabra para reconocerlo, nombre, moneda]
  ["nicaragua", "Nicaragua", "NIO"],
  ["mexico", "México", "MXN"],
  ["guatemala", "Guatemala", "GTQ"],
  ["honduras", "Honduras", "HNL"],
  ["salvador", "El Salvador", "USD"],
  ["costa rica", "Costa Rica", "CRC"],
  ["panama", "Panamá", "USD"],
  ["colombia", "Colombia", "COP"],
  ["peru", "Perú", "PEN"],
  ["ecuador", "Ecuador", "USD"],
  ["dominicana", "República Dominicana", "DOP"],
  ["puerto rico", "Puerto Rico", "USD"],
  ["espana", "España", "EUR"],
  ["chile", "Chile", "CLP"],
  ["argentina", "Argentina", "ARS"],
  ["estados unidos", "Estados Unidos", "USD"],
  ["usa", "Estados Unidos", "USD"],
  ["eeuu", "Estados Unidos", "USD"],
  ["ee.uu", "Estados Unidos", "USD"],
];

export function findCountry(text: string): { name: string; currency: string } | null {
  const t = norm(text);
  const hit = COUNTRIES.find(([k]) => t.includes(k));
  return hit ? { name: hit[1], currency: hit[2] } : null;
}

const SYMBOLS: Record<string, string> = {
  USD: "$",
  NIO: "C$",
  MXN: "$",
  GTQ: "Q",
  HNL: "L",
  CRC: "₡",
  COP: "$",
  PEN: "S/",
  DOP: "RD$",
  EUR: "€",
  CLP: "$",
  ARS: "$",
};

export function money(n: number, currency = "USD") {
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${Number(n).toFixed(2).replace(/\.00$/, "")}`;
}

export function priceLabel(price: number | null, currency = "USD") {
  return price === null ? "precio a consultar" : `desde ${money(price, currency)}`;
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

// Lee "corte de pasto 45, poda 80" o "herramientas, pintura, plomería" (sin precios).
export function parseServices(text: string): ServiceInput[] {
  return text
    .split(/[,\n;]+|\s+y\s+/)
    .map((part) => {
      const clean = part.trim().replace(/[.]+$/, "");
      if (!clean) return null;
      const m = clean.match(
        /^(.*?)[\s:–-]*(?:c\$|rd\$|s\/|\$|q|l|₡|€)?\s*(\d+(?:\.\d+)?)\s*(dolares|dólares|usd|pesos|cordobas|córdobas|quetzales|lempiras|colones|soles|euros)?$/i,
      );
      const name = (m ? m[1] : clean).trim().replace(/[\s:–-]+$/, "");
      if (!name || name.length > 80 || /^\d+$/.test(name)) return null;
      return { name: cap(name), price: m ? parseFloat(m[2]) : null };
    })
    .filter((s): s is ServiceInput => s !== null);
}

export function servicesText(list: ServiceInput[], currency = "USD") {
  return list.map((s) => (s.price === null ? s.name : `${s.name} ${money(s.price, currency)}`)).join(" · ");
}

// Cómo se muestra lo que Nuna entendió de cada pregunta (null = todavía no lo sabe).
export function describeAnswer(key: QuestionKey, b: BusinessRow, services: ServiceInput[], done: boolean): string | null {
  switch (key) {
    case "name":
      return b.name === "Mi negocio" ? null : b.name;
    case "owner":
      return b.owner_name;
    case "location":
      return [b.zone, b.country].filter(Boolean).join(", ") || null;
    case "business_type":
      return { products: "Vende productos", services: "Da servicios", both: "Productos y servicios" }[b.business_type ?? ""] ?? null;
    case "industry":
      return b.industry;
    case "offerings":
      return services.length ? servicesText(services, b.currency) : null;
    case "hours":
      return b.hours;
    case "lead_sources":
      return b.lead_sources;
    case "visit_before_quote":
      return b.visit_before_quote === null ? null : b.visit_before_quote ? "Revisa antes de cotizar" : "Cotiza directo";
    case "payment_timing":
      return (
        {
          at_sale: "Al momento de la compra",
          deposit: "Con anticipo o apartado",
          credit: "A crédito",
          before: "Antes de empezar",
          after: "Al terminar el trabajo",
        }[b.payment_timing ?? ""] ?? null
      );
    case "offers_delivery":
      return b.offers_delivery === null ? null : b.offers_delivery ? "Sí hace entregas" : "No hace entregas";
    case "has_recurring_clients":
      return b.has_recurring_clients === null ? null : b.has_recurring_clients ? "Sí" : "No";
    case "quote_requires_approval":
      return done ? (b.quote_requires_approval ? "Las revisa antes de enviar" : "Nuna las manda sola") : null;
  }
}

// ---------- lectura de respuestas por reglas ----------

export type Extraction =
  | { ok: true; ack: string; patch: BusinessPatch; services?: ServiceInput[] }
  | { ok: false; ack: string };

export function extractWithRules(key: QuestionKey, raw: string, b: B): Extraction {
  let text = raw.trim();
  const t = norm(text);
  if (!text) return { ok: false, ack: "¿Me lo repites?" };

  switch (key) {
    case "location": {
      const country = findCountry(text);
      return {
        ok: true,
        ack: country ? `Anotado: ${country.name}.` : "Anotado.",
        patch: { zone: text, country: country?.name ?? null, currency: country?.currency ?? "USD" },
      };
    }
    case "business_type": {
      const product = has(t, ["producto", "vendo", "venta", "tienda", "articulo", "mercancia", "ferreteria"]);
      const service = has(t, ["servicio", "trabajo", "instalo", "reparo", "hago"]) && !t.includes("no hago");
      const both = has(t, ["ambos", "las dos", "los dos"]) || (product && service);
      const v: BusinessType | null = both ? "both" : product ? "products" : service ? "services" : null;
      if (!v) return { ok: false, ack: "Para entender bien: ¿vendes productos, das servicios, o las dos cosas?" };
      const label = { products: "vendes productos", services: "das servicios", both: "vendes productos y das servicios" }[v];
      return { ok: true, ack: `Entendido: ${label}.`, patch: { business_type: v } };
    }
    case "offerings": {
      const list = parseServices(text);
      if (!list.length)
        return { ok: false, ack: "¿Qué vendes o qué servicios das? Escríbelos separados por comas, con precio si lo tienes." };
      return { ok: true, ack: `Anoté: ${servicesText(list)}.`, patch: {}, services: list };
    }
    case "visit_before_quote": {
      const v = has(t, ["ver", "visita", "revis", "primero", "voy"]) && !has(t, ["directo", "no reviso", "no voy"]);
      return {
        ok: true,
        ack: v ? "Entendido: primero revisas y luego cotizas. Yo te agendo esas visitas." : "Entendido: cotizas directo.",
        patch: { visit_before_quote: v },
      };
    }
    case "payment_timing": {
      let v: string;
      if (has(t, ["credito", "fiado", "plazo"])) v = "credit";
      else if (has(t, ["anticipo", "adelanto", "mitad", "deposito", "apartado"])) v = "deposit";
      else if (has(t, ["antes de empezar", "antes"]) && !sells(b)) v = "before";
      else if (has(t, ["termin", "despues", "al final"])) v = "after";
      else v = sells(b) ? "at_sale" : "after";
      const label = {
        credit: "Das crédito",
        deposit: "Cobras anticipo o apartado",
        before: "Cobras antes de empezar",
        after: "Cobras al terminar el trabajo",
        at_sale: "Te pagan al momento de la compra",
      }[v];
      return { ok: true, ack: `${label}. Yo mando el cobro en el momento correcto.`, patch: { payment_timing: v } };
    }
    case "offers_delivery": {
      const v = !saysNo(t) && (saysYes(t) || has(t, ["entrego", "domicilio", "envio", "llevo", "delivery"]));
      return { ok: true, ack: v ? "Perfecto, anoto que haces entregas." : "Entendido, sin entregas.", patch: { offers_delivery: v } };
    }
    case "has_recurring_clients": {
      const v = !saysNo(t) && (saysYes(t) || has(t, ["cada", "semana", "mes", "fijo", "repit", "seguido", "frecuent"]));
      return {
        ok: true,
        ack: v ? "Perfecto, a esos clientes les doy seguimiento especial." : "Entendido.",
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
      text = cap(text.replace(/^(nos dedicamos a|me dedico a|hacemos|es (una|un) )\s*/i, ""));
      return { ok: true, ack: "Entendido.", patch: { industry: text } };
    case "hours":
      return { ok: true, ack: "Perfecto.", patch: { hours: text } };
    case "lead_sources":
      return { ok: true, ack: "Muy bien: todos esos canales van a llegar a una sola bandeja.", patch: { lead_sources: text } };
  }
}
