// Perfiles de mercado por país: moneda, trato, formas de pago, canales, forma de dar direcciones,
// palabras locales y costumbres. Nuna los usa para entender al dueño y hablar como la gente del lugar.
//
// IMPORTANTE: son perfiles iniciales hechos con conocimiento general. Hay que validarlos y
// ajustarlos con dueños reales de cada país antes de vender ahí.

export type AddressForm = "tu" | "usted" | "vos";

// Países donde Orbusiness ya está disponible. Los demás perfiles quedan listos para encenderlos después.
export const ACTIVE_MARKETS = ["MX", "GT", "HN", "SV", "NI", "CR", "PA", "US", "CA"];
export const AVAILABILITY = "México, Centroamérica (Guatemala, Honduras, El Salvador, Nicaragua, Costa Rica y Panamá), Estados Unidos y Canadá";

export type Market = {
  code: string; // ISO 3166-1 alfa-2
  name: string;
  match: string[]; // palabras (sin acentos, minúsculas) para reconocer el país
  currency: string; // moneda principal (ISO 4217)
  secondCurrency?: string; // otra moneda muy usada en precios (p. ej. dólares)
  dialCode: string;
  addressForm: AddressForm; // trato más común con clientes
  addressStyle: string;
  paymentMethods: string[];
  channels: string[];
  glossary: [string, string][]; // [palabra local, qué significa]
  customs: string[];
};

export const MARKETS: Market[] = [
  // ---------- México ----------
  {
    code: "MX",
    name: "México",
    match: ["mexico", "cdmx", "guadalajara", "monterrey", "puebla", "tijuana", "oaxaca", "merida", "cancun", "queretaro", "guanajuato", "veracruz", "chihuahua", "toluca", "morelia", "hermosillo"],
    currency: "MXN",
    dialCode: "52",
    addressForm: "tu",
    addressStyle: "calle y número, colonia, código postal y ciudad",
    paymentMethods: ["Efectivo", "Transferencia SPEI", "Tarjeta", "Pago en OXXO", "Mercado Pago", "Meses sin intereses"],
    channels: ["WhatsApp", "Facebook", "Llamadas"],
    glossary: [
      ["lana / varo", "dinero"],
      ["abarrotes / tiendita", "tienda de barrio"],
      ["chamba", "trabajo"],
      ["a meses", "pago en mensualidades con tarjeta"],
      ["fiado", "a crédito"],
    ],
    customs: ["Se usa tú con clientes jóvenes y usted con mayores", "Se espera respuesta rápida por WhatsApp"],
  },
  // ---------- Centroamérica ----------
  {
    code: "GT",
    name: "Guatemala",
    match: ["guatemala", "xela", "quetzaltenango", "mixco", "escuintla", "huehuetenango"],
    currency: "GTQ",
    dialCode: "502",
    addressForm: "usted",
    addressStyle: "dirección por zona (por ejemplo, 5a avenida 10-20, zona 1) y municipio",
    paymentMethods: ["Efectivo", "Transferencia", "Depósito bancario", "Tarjeta"],
    channels: ["WhatsApp", "Facebook", "Llamadas"],
    glossary: [
      ["pisto", "dinero"],
      ["quetzales / Q", "moneda local"],
      ["chapín", "guatemalteco"],
      ["al crédito", "a crédito"],
    ],
    customs: ["Trato de usted, cortés y formal con clientes", "Se usa vos en confianza"],
  },
  {
    code: "HN",
    name: "Honduras",
    match: ["honduras", "tegucigalpa", "san pedro sula", "la ceiba", "comayagua", "choluteca"],
    currency: "HNL",
    dialCode: "504",
    addressForm: "usted",
    addressStyle: "colonia, calle y puntos de referencia",
    paymentMethods: ["Efectivo", "Transferencia", "Tarjeta", "Tigo Money"],
    channels: ["WhatsApp", "Facebook", "Llamadas"],
    glossary: [
      ["pisto", "dinero"],
      ["lempiras / L", "moneda local"],
      ["pulpería", "tienda de barrio"],
      ["al crédito / fiado", "a crédito"],
    ],
    customs: ["Trato de usted con clientes; vos en confianza", "Direcciones con referencias"],
  },
  {
    code: "SV",
    name: "El Salvador",
    match: ["el salvador", "san salvador", "soyapango", "santa tecla"],
    currency: "USD",
    dialCode: "503",
    addressForm: "usted",
    addressStyle: "colonia, calle, número y puntos de referencia",
    paymentMethods: ["Efectivo", "Transferencia", "Tarjeta"],
    channels: ["WhatsApp", "Facebook", "Llamadas"],
    glossary: [
      ["pisto", "dinero"],
      ["chivo", "bueno, bonito"],
      ["tienda", "tienda de barrio"],
    ],
    customs: ["Trato de usted con clientes; vos en confianza", "Precios en dólares"],
  },
  {
    code: "NI",
    name: "Nicaragua",
    match: ["nicaragua", "managua", "masaya", "esteli", "matagalpa", "chinandega"],
    currency: "NIO",
    secondCurrency: "USD",
    dialCode: "505",
    addressForm: "vos",
    addressStyle:
      "puntos de referencia (por ejemplo: de donde fue el cine, 2 cuadras al lago, 1 cuadra arriba), barrio y ciudad",
    paymentMethods: ["Efectivo", "Transferencia (BAC, Lafise, Banpro)", "Tarjeta", "Fiado / crédito"],
    channels: ["WhatsApp", "Facebook", "Llamadas"],
    glossary: [
      ["pesos / reales", "córdobas o dinero en general"],
      ["C$ / córdobas", "moneda local"],
      ["pulpería", "tienda de barrio"],
      ["fiado", "a crédito"],
      ["al lago / arriba / abajo", "direcciones: hacia el norte / hacia el este / hacia el oeste"],
      ["chunche", "cosa, objeto"],
    ],
    customs: [
      "Se usa vos en el trato diario; usted con mayores o en trato formal",
      "Precios en córdobas y muchas veces también en dólares",
      "Direcciones con puntos de referencia, no con número de calle",
    ],
  },
  {
    code: "CR",
    name: "Costa Rica",
    match: ["costa rica", "alajuela", "heredia", "cartago"],
    currency: "CRC",
    secondCurrency: "USD",
    dialCode: "506",
    addressForm: "usted",
    addressStyle: "metros desde un punto de referencia (por ejemplo: 200 metros norte de la iglesia) y distrito",
    paymentMethods: ["Efectivo", "SINPE Móvil", "Tarjeta", "Transferencia"],
    channels: ["WhatsApp", "Facebook", "Llamadas"],
    glossary: [
      ["harina / plata", "dinero"],
      ["un rojo", "mil colones"],
      ["una teja", "cien colones"],
      ["pura vida", "saludo; todo bien"],
      ["SINPE", "pago por transferencia al celular"],
    ],
    customs: ["Se usa usted incluso con conocidos", "SINPE Móvil es el pago más común entre personas"],
  },
  {
    code: "PA",
    name: "Panamá",
    match: ["panama", "chiriqui", "ciudad de panama"],
    currency: "USD",
    dialCode: "507",
    addressForm: "usted",
    addressStyle: "corregimiento, calle y puntos de referencia",
    paymentMethods: ["Efectivo", "Yappy", "Tarjeta", "Transferencia ACH"],
    channels: ["WhatsApp", "Instagram", "Llamadas"],
    glossary: [
      ["plata / chen chen", "dinero"],
      ["un palo", "un dólar"],
      ["Yappy", "pago por el celular"],
    ],
    customs: ["Precios en dólares (balboas)", "Yappy muy usado para pagar"],
  },
  // ---------- Sudamérica ----------
  {
    code: "CO",
    name: "Colombia",
    match: ["colombia", "bogota", "medellin", "cali", "barranquilla", "cartagena", "bucaramanga"],
    currency: "COP",
    dialCode: "57",
    addressForm: "usted",
    addressStyle: "calle o carrera con número (por ejemplo: Cra 7 # 45-10), barrio y ciudad",
    paymentMethods: ["Efectivo", "Nequi", "Daviplata", "Transferencia Bancolombia", "PSE", "Tarjeta"],
    channels: ["WhatsApp", "Instagram", "Facebook"],
    glossary: [
      ["plata", "dinero"],
      ["luca / barra", "mil pesos"],
      ["domicilio", "entrega a domicilio"],
      ["tienda de barrio", "tienda pequeña"],
      ["fiado", "a crédito"],
    ],
    customs: ["Se usa mucho usted, incluso con cercanos", "Domicilios muy comunes"],
  },
  {
    code: "VE",
    name: "Venezuela",
    match: ["venezuela", "caracas", "maracaibo", "valencia venezuela", "barquisimeto"],
    currency: "USD",
    secondCurrency: "VES",
    dialCode: "58",
    addressForm: "tu",
    addressStyle: "urbanización o sector, calle y puntos de referencia",
    paymentMethods: ["Efectivo en dólares", "Pago móvil", "Zelle", "Punto de venta", "Transferencia"],
    channels: ["WhatsApp", "Instagram", "Llamadas"],
    glossary: [
      ["real / plata", "dinero"],
      ["verdes", "dólares"],
      ["bodega", "tienda de barrio"],
      ["pago móvil", "transferencia por el celular en bolívares"],
    ],
    customs: ["Precios casi siempre en dólares, pago también en bolívares", "Trato de tú cercano"],
  },
  {
    code: "EC",
    name: "Ecuador",
    match: ["ecuador", "quito", "guayaquil", "cuenca"],
    currency: "USD",
    dialCode: "593",
    addressForm: "usted",
    addressStyle: "calle principal y secundaria, número, sector y referencia",
    paymentMethods: ["Efectivo", "Transferencia", "Tarjeta"],
    channels: ["WhatsApp", "Facebook", "Llamadas"],
    glossary: [
      ["plata", "dinero"],
      ["tienda", "tienda de barrio"],
      ["fiado", "a crédito"],
    ],
    customs: ["Precios en dólares", "Trato de usted con clientes"],
  },
  {
    code: "PE",
    name: "Perú",
    match: ["peru", "lima", "arequipa", "trujillo", "cusco", "piura"],
    currency: "PEN",
    dialCode: "51",
    addressForm: "tu",
    addressStyle: "avenida, jirón o calle con número, distrito y referencia",
    paymentMethods: ["Efectivo", "Yape", "Plin", "Tarjeta", "Transferencia"],
    channels: ["WhatsApp", "Facebook", "TikTok"],
    glossary: [
      ["lucas", "soles"],
      ["sencillo", "monedas o cambio"],
      ["bodega", "tienda de barrio"],
      ["chamba", "trabajo"],
      ["Yape / Plin", "pago por el celular"],
    ],
    customs: ["Yape y Plin son el pago más común", "Tú con clientes jóvenes, usted con mayores"],
  },
  {
    code: "BO",
    name: "Bolivia",
    match: ["bolivia", "la paz", "santa cruz", "cochabamba", "el alto", "sucre"],
    currency: "BOB",
    dialCode: "591",
    addressForm: "usted",
    addressStyle: "zona, calle con número y referencia",
    paymentMethods: ["Efectivo", "Pago con QR", "Transferencia", "Tarjeta"],
    channels: ["WhatsApp", "Facebook", "TikTok"],
    glossary: [
      ["plata", "dinero"],
      ["casero / caserita", "cliente frecuente"],
      ["yapa", "algo extra de regalo con la compra"],
    ],
    customs: ["El pago con QR es muy común", "Se aprecia la yapa y el trato de casero"],
  },
  {
    code: "CL",
    name: "Chile",
    match: ["chile", "santiago de chile", "valparaiso", "concepcion", "antofagasta"],
    currency: "CLP",
    dialCode: "56",
    addressForm: "tu",
    addressStyle: "calle y número, comuna y ciudad",
    paymentMethods: ["Transferencia", "Tarjeta de débito", "Efectivo", "Mercado Pago"],
    channels: ["WhatsApp", "Instagram", "Facebook"],
    glossary: [
      ["luca", "mil pesos"],
      ["plata", "dinero"],
      ["almacén", "tienda de barrio"],
      ["al tiro", "de inmediato"],
    ],
    customs: ["La transferencia es el pago más común entre personas", "Trato de tú"],
  },
  {
    code: "AR",
    name: "Argentina",
    match: ["argentina", "buenos aires", "cordoba argentina", "rosario", "mendoza"],
    currency: "ARS",
    dialCode: "54",
    addressForm: "vos",
    addressStyle: "calle y número, barrio y ciudad",
    paymentMethods: ["Efectivo", "Transferencia", "Mercado Pago", "Tarjeta en cuotas"],
    channels: ["WhatsApp", "Instagram", "Facebook"],
    glossary: [
      ["plata / guita", "dinero"],
      ["luca", "mil pesos"],
      ["kiosco / almacén", "tienda de barrio"],
      ["en cuotas", "pago en mensualidades"],
    ],
    customs: ["Se usa vos siempre", "Los precios cambian seguido por la inflación"],
  },
  {
    code: "UY",
    name: "Uruguay",
    match: ["uruguay", "montevideo", "punta del este"],
    currency: "UYU",
    dialCode: "598",
    addressForm: "tu",
    addressStyle: "calle y número, barrio y ciudad",
    paymentMethods: ["Efectivo", "Transferencia", "Tarjeta de débito", "Mercado Pago"],
    channels: ["WhatsApp", "Instagram", "Facebook"],
    glossary: [
      ["plata / guita", "dinero"],
      ["almacén", "tienda de barrio"],
    ],
    customs: ["Se usa tú o vos según la zona"],
  },
  {
    code: "PY",
    name: "Paraguay",
    match: ["paraguay", "asuncion", "ciudad del este", "encarnacion"],
    currency: "PYG",
    dialCode: "595",
    addressForm: "vos",
    addressStyle: "calle, barrio y puntos de referencia",
    paymentMethods: ["Efectivo", "Transferencia", "Tarjeta", "Billetera Tigo Money"],
    channels: ["WhatsApp", "Facebook", "Llamadas"],
    glossary: [
      ["plata", "dinero"],
      ["despensa", "tienda de barrio"],
      ["jopará", "mezcla de español y guaraní"],
    ],
    customs: ["Se usa vos; mucha gente mezcla español y guaraní"],
  },
  // ---------- Otros mercados en español ----------
  {
    code: "DO",
    name: "República Dominicana",
    match: ["dominicana", "santo domingo", "santiago de los caballeros", "punta cana"],
    currency: "DOP",
    dialCode: "1",
    addressForm: "tu",
    addressStyle: "calle y número, sector y ciudad",
    paymentMethods: ["Efectivo", "Transferencia", "Tarjeta"],
    channels: ["WhatsApp", "Instagram", "Llamadas"],
    glossary: [
      ["cuarto", "dinero"],
      ["colmado", "tienda de barrio"],
    ],
    customs: ["El colmado hace entregas a domicilio muy rápido"],
  },
  {
    code: "US",
    name: "Estados Unidos",
    match: ["estados unidos", "usa", "eeuu", "ee.uu", "united states", "miami", "florida", "texas", "houston", "dallas", "california", "los angeles", "chicago", "new york", "nueva york", "new jersey", "nueva jersey", "arizona", "georgia", "carolina"],
    currency: "USD",
    dialCode: "1",
    addressForm: "tu",
    addressStyle: "calle y número, ciudad, estado y código postal (ZIP)",
    paymentMethods: ["Tarjeta", "Zelle", "Venmo", "Cash App", "Efectivo"],
    channels: ["SMS", "Llamadas", "Facebook", "WhatsApp"],
    glossary: [
      ["estimate", "cotización"],
      ["delivery", "entrega a domicilio"],
    ],
    customs: ["Muchos clientes hablan inglés o mezclan inglés y español"],
  },
  {
    code: "CA",
    name: "Canadá",
    match: ["canada", "toronto", "montreal", "vancouver", "calgary", "ottawa", "quebec", "edmonton", "winnipeg"],
    currency: "CAD",
    dialCode: "1",
    addressForm: "tu",
    addressStyle: "calle y número, ciudad, provincia y código postal",
    paymentMethods: ["Tarjeta", "Interac e-Transfer", "Efectivo"],
    channels: ["SMS", "Llamadas", "Facebook", "WhatsApp"],
    glossary: [
      ["e-Transfer", "transferencia Interac por correo o celular"],
      ["estimate / quote", "cotización"],
    ],
    customs: ["Muchos clientes hablan inglés; en Quebec, francés", "Interac e-Transfer es el pago más común entre personas"],
  },
];

const BY_CODE = new Map(MARKETS.map((m) => [m.code, m]));

export function marketFor(code: string | null | undefined): Market | null {
  return code ? (BY_CODE.get(code) ?? null) : null;
}

export function isActiveMarket(m: Market | null): boolean {
  return Boolean(m && ACTIVE_MARKETS.includes(m.code));
}

function plain(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Reconoce el país en un texto libre ("Managua, Nicaragua", "en Lima").
export function findMarket(text: string): Market | null {
  const t = plain(text);
  const hasWord = (w: string) => new RegExp(`(^|[^a-z])${w.replace(/[.]/g, "\\.")}([^a-z]|$)`).test(t);
  return MARKETS.find((m) => m.match.some(hasWord)) ?? null;
}

// Texto según el trato: tú / usted / vos.
export function say(form: AddressForm | string | null | undefined, v: { tu: string; usted: string; vos: string }) {
  return form === "usted" ? v.usted : form === "vos" ? v.vos : v.tu;
}

// Contexto del país para la IA de Nuna.
export function marketContext(m: Market | null): string {
  if (!m) return "";
  return [
    `País del negocio: ${m.name}. Moneda: ${m.currency}${m.secondCurrency ? ` (también se usa ${m.secondCurrency})` : ""}.`,
    `Trato habitual: ${{ tu: "tú", usted: "usted", vos: "vos" }[m.addressForm]}.`,
    `Palabras locales: ${m.glossary.map(([w, s]) => `"${w}" = ${s}`).join("; ")}.`,
    `Costumbres: ${m.customs.join("; ")}.`,
  ].join("\n");
}

// Teléfono con código de país, listo para WhatsApp (+50588887777).
export function normalizePhone(raw: string, m: Market | null): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 7) return null;
  if (digits.startsWith("+")) return `+${digits.slice(1).replace(/\D/g, "")}`;
  const d = digits.replace(/\D/g, "");
  if (m && d.startsWith(m.dialCode) && d.length > 9) return `+${d}`;
  return m ? `+${m.dialCode}${d}` : `+${d}`;
}
