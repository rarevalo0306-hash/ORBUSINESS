// Guion de la entrevista de reconocimiento. Se adapta al tipo de negocio:
// tiendas (productos), servicios, o ambos. Nuna (lib/nuna.ts) usa IA si hay llave;
// si no, o si la IA falla, entiende las respuestas con las reglas de este archivo.

import type { Database } from "@/lib/database.types";
import { AVAILABILITY, MARKETS, findMarket, isActiveMarket, marketFor, normalizePhone, type AddressForm } from "@/lib/markets";

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
  | "currencies"
  | "hours"
  | "phone"
  | "address"
  | "lead_sources"
  | "visit_before_quote"
  | "payment_timing"
  | "payment_methods"
  | "offers_delivery"
  | "has_recurring_clients"
  | "address_form"
  | "quote_requires_approval";

type B = Pick<BusinessRow, "business_type" | "country_code">;
const sells = (b: B) => b.business_type === "products" || b.business_type === "both";
const serves = (b: B) => b.business_type !== "products"; // servicios, ambos, o aún no se sabe

const CURRENCY_NAMES: Record<string, string> = {
  NIO: "córdobas",
  USD: "dólares",
  CRC: "colones",
  VES: "bolívares",
  CAD: "dólares canadienses",
  MXN: "pesos",
  GTQ: "quetzales",
  HNL: "lempiras",
  COP: "pesos",
  PEN: "soles",
  BOB: "bolivianos",
  CLP: "pesos",
  ARS: "pesos",
  UYU: "pesos",
  PYG: "guaraníes",
  DOP: "pesos",
};
export const currencyName = (code: string) => CURRENCY_NAMES[code] ?? code;
const FORM_NAMES: Record<AddressForm, string> = { tu: "de tú", usted: "de usted", vos: "de vos" };

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
    key: "currencies",
    label: "Moneda de tus precios",
    text: (b) => {
      const m = marketFor(b.country_code)!;
      return `¿Tus precios los manejas en ${currencyName(m.currency)}, en ${currencyName(m.secondCurrency!)}, o en los dos?`;
    },
    hint: (b) => {
      const m = marketFor(b.country_code);
      return `currency_choice: local (solo ${m ? currencyName(m.currency) : "moneda local"}), other (solo ${m?.secondCurrency ? currencyName(m.secondCurrency) : "la otra moneda"}), both (las dos).`;
    },
    applies: (b) => Boolean(marketFor(b.country_code)?.secondCurrency),
  },
  {
    key: "hours",
    label: "Horario",
    text: () => "¿Qué días y horas abres o trabajas?",
    hint: () => "Días y horario.",
  },
  {
    key: "phone",
    label: "WhatsApp del negocio",
    text: () => "¿Cuál es el número de WhatsApp o teléfono del negocio? Ahí te van a escribir tus clientes.",
    hint: () => "text_value = el número tal como lo dijo, con o sin código de país.",
  },
  {
    key: "address",
    label: "Dirección",
    text: (b) => {
      const m = marketFor(b.country_code);
      if (!m) return "¿Cuál es la dirección del negocio? Dímela como se la das a tus clientes.";
      const example = m.addressStyle.match(/\(por ejemplo:?\s*([^)]*)\)/i)?.[1];
      const style = m.addressStyle.replace(/\s*\(por ejemplo[^)]*\)/i, "");
      return `¿Cuál es la dirección del negocio? Dímela como se la das a tus clientes, con ${style}.${example ? ` Por ejemplo: ${example}.` : ""}`;
    },
    hint: () => "text_value = la dirección tal como la daría a un cliente, con sus puntos de referencia.",
    applies: sells,
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
    key: "payment_methods",
    label: "Formas de pago",
    text: (b) => {
      const m = marketFor(b.country_code);
      return `¿Qué formas de pago aceptas? Por ejemplo: ${(m?.paymentMethods ?? ["Efectivo", "Transferencia", "Tarjeta"]).join(", ")}.`;
    },
    hint: () => "payment_methods = lista de formas de pago que mencionó, con su nombre local (Yape, SINPE Móvil, Nequi, OXXO…).",
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
    key: "address_form",
    label: "Trato con tus clientes",
    text: (b) => {
      const m = marketFor(b.country_code);
      return `¿Cómo quieres que les hable a tus clientes: de tú, de usted o de vos?${m ? ` En ${m.name} lo más común es ${FORM_NAMES[m.addressForm]}.` : ""}`;
    },
    hint: () => "address_form: tu, usted o vos. Si le da igual, usa el trato habitual del país.",
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

// Preguntas que aplican a este negocio y todavía no tienen respuesta, en orden.
// Algunas tienen un valor por defecto (moneda, trato, cotizaciones): esas cuentan como
// respondidas solo si el dueño ya las contestó.
const ASKED_ONLY = new Set<QuestionKey>(["currencies", "address_form", "quote_requires_approval"]);

export function missingQuestions(b: BusinessRow, services: ServiceInput[], answeredKeys: Set<string>): Question[] {
  return QUESTIONS.filter((q) => {
    if (q.applies && !q.applies(b)) return false;
    if (ASKED_ONLY.has(q.key)) return !answeredKeys.has(q.key);
    if (q.key === "location") return !b.country_code; // sin país no hay moneda ni costumbres locales
    return describeAnswer(q.key, b, services, true) === null;
  });
}

// La IA a veces hace su propia pregunta en el acuse; la app agrega la siguiente pregunta,
// así que se quitan las oraciones con pregunta para que Nuna pregunte una sola cosa a la vez.
export function withoutQuestions(ack: string): string {
  const kept = ack
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !sentence.includes("?") && !sentence.includes("¿"));
  return kept.join(" ").trim() || "Anotado.";
}

// ---------- moneda ----------

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
  UYU: "$U",
  PYG: "₲",
  BOB: "Bs",
  VES: "Bs.",
  CAD: "CA$",
};

export function money(n: number, currency = "USD") {
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${Number(n).toFixed(2).replace(/\.00$/, "")}`;
}

export function priceLabel(price: number | null, currency = "USD") {
  return price === null ? "precio a consultar" : `desde ${money(price, currency)}`;
}

// Moneda de los precios según la respuesta: solo local, solo la otra, o las dos.
export function currencyPatch(choice: "local" | "other" | "both", b: B): BusinessPatch {
  const m = marketFor(b.country_code);
  if (!m?.secondCurrency) return {};
  if (choice === "other") return { currency: m.secondCurrency, secondary_currency: null };
  if (choice === "both") return { currency: m.currency, secondary_currency: m.secondCurrency };
  return { currency: m.currency, secondary_currency: null };
}

// Respuesta de ubicación: el país debe ser uno donde Orbusiness ya está disponible.
export function locationCheck(text: string, countryHint?: string | null): { ok: true; patch: BusinessPatch } | { ok: false; ack: string } {
  const m = (countryHint ? findMarket(countryHint) : null) ?? findMarket(text);
  if (!m) return { ok: false, ack: "¿En qué país está tu negocio? Así uso la moneda y las costumbres de ahí." };
  if (!isActiveMarket(m))
    return {
      ok: false,
      ack: `Por ahora Orbusiness está disponible en ${AVAILABILITY}. Muy pronto llegamos a ${m.name}. Si tu negocio está en alguno de esos países, dime en cuál.`,
    };
  return { ok: true, patch: locationPatch(text, m.name) };
}

export function locationPatch(text: string, countryHint?: string | null): BusinessPatch {
  const m = (countryHint ? findMarket(countryHint) : null) ?? findMarket(text);
  return {
    zone: text || null,
    country: m?.name ?? countryHint ?? null,
    country_code: m?.code ?? null,
    currency: m?.currency ?? "USD",
    secondary_currency: null,
    address_form: m?.addressForm ?? null,
  };
}

function currencyWords(code: string): string[] {
  const words: Record<string, string[]> = {
    NIO: ["cordoba", "peso", "c$"],
    USD: ["dolar", "dolares", "usd", "verdes"],
    CRC: ["colon", "colones", "rojo", "teja"],
    VES: ["bolivar", "bolivares", "bs"],
  };
  return words[code] ?? [norm(currencyName(code))];
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
    case "location": {
      const where = [b.zone, b.country && !norm(b.zone ?? "").includes(norm(b.country)) ? b.country : null];
      return where.filter(Boolean).join(", ") || null;
    }
    case "currencies":
      return b.secondary_currency
        ? `${currencyName(b.currency)} y ${currencyName(b.secondary_currency)}`
        : b.country_code
          ? `Solo ${currencyName(b.currency)}`
          : null;
    case "phone":
      return b.phone;
    case "address":
      return b.address;
    case "payment_methods":
      return b.payment_methods.length ? b.payment_methods.join(", ") : null;
    case "address_form":
      return b.address_form ? FORM_NAMES[b.address_form as AddressForm].replace("de ", "De ") : null;
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

// patch en un resultado fallido = datos extra que el dueño dijo de paso (por ejemplo, el nombre).
export type Extraction =
  | { ok: true; ack: string; patch: BusinessPatch; services?: ServiceInput[] }
  | { ok: false; ack: string; patch?: BusinessPatch };

export function extractWithRules(key: QuestionKey, raw: string, b: B): Extraction {
  let text = raw.trim();
  const t = norm(text);
  if (!text) return { ok: false, ack: "¿Me lo repites?" };

  switch (key) {
    case "location": {
      const check = locationCheck(text);
      if (!check.ok) return check;
      return { ok: true, ack: `Anotado: ${check.patch.country}.`, patch: check.patch };
    }
    case "currencies": {
      const m = marketFor(b.country_code);
      const local = m ? currencyWords(m.currency) : [];
      const other = m?.secondCurrency ? currencyWords(m.secondCurrency) : [];
      const saysLocal = has(t, local);
      const saysOther = has(t, other);
      const choice = has(t, ["ambos", "las dos", "los dos", "las 2", "los 2"]) || (saysLocal && saysOther) ? "both" : saysOther ? "other" : "local";
      const patch = currencyPatch(choice, b);
      const label = patch.secondary_currency
        ? `${currencyName(patch.currency!)} y ${currencyName(patch.secondary_currency)}`
        : currencyName(patch.currency ?? "USD");
      return { ok: true, ack: `Anotado: precios en ${label}.`, patch };
    }
    case "phone": {
      const phone = normalizePhone(text, marketFor(b.country_code));
      if (!phone) return { ok: false, ack: "No estoy segura de qué país es ese número. ¿Me lo escribes con el código de país? Por ejemplo: +505 8888 7777." };
      return { ok: true, ack: `Anotado: ${phone}.`, patch: { phone } };
    }
    case "address":
      return { ok: true, ack: "Anotada la dirección.", patch: { address: text } };
    case "payment_methods": {
      const known = marketFor(b.country_code)?.paymentMethods ?? MARKETS[0].paymentMethods;
      const found = known.filter((p) => t.includes(norm(p).split(/[\s(/]/)[0]));
      for (const [word, label] of [["efectivo", "Efectivo"], ["tarjeta", "Tarjeta"], ["transferencia", "Transferencia"], ["fiado", "Fiado / crédito"], ["credito", "Fiado / crédito"]] as const) {
        if (t.includes(word) && !found.some((f) => norm(f).includes(word))) found.push(label);
      }
      const methods = found.length ? found : text.split(/[,;\n]+|\s+y\s+/).map((x) => cap(x)).filter(Boolean);
      return { ok: true, ack: `Anotado: ${methods.join(", ")}.`, patch: { payment_methods: methods } };
    }
    case "address_form": {
      const w = words(t);
      const form: AddressForm | null = w.includes("usted") ? "usted" : w.includes("vos") ? "vos" : w.includes("tu") || t.includes("tute") ? "tu" : marketFor(b.country_code)?.addressForm ?? null;
      if (!form) return { ok: false, ack: "¿De tú, de usted o de vos?" };
      return { ok: true, ack: `Perfecto: les hablo ${FORM_NAMES[form]}.`, patch: { address_form: form } };
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
