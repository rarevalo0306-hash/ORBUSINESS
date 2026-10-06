import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { marketContext, marketFor, normalizePhone } from "@/lib/markets";
import {
  currencyPatch,
  locationCheck,
  ownerForm,
  withoutQuestions,
  questionFor,
  extractWithRules,
  type BusinessPatch,
  type BusinessRow,
  type Extraction,
  type QuestionKey,
} from "@/lib/interview";

type B = Pick<BusinessRow, "business_type" | "country_code"> &
  Partial<Pick<BusinessRow, "name" | "industry" | "owner_name">>;

// ---------- Proveedor de IA ----------
// Se elige con NUNA_AI_PROVIDER = "deepseek" | "anthropic" | "rules".
// Si no se define, usa el primero que tenga llave (DeepSeek, luego Claude); sin llaves, reglas.

type Provider = "deepseek" | "anthropic" | "rules";

export function nunaProvider(): Provider {
  const chosen = process.env.NUNA_AI_PROVIDER;
  if (chosen === "deepseek" && process.env.DEEPSEEK_API_KEY) return "deepseek";
  if (chosen === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (chosen === "rules") return "rules";
  if (process.env.DEEPSEEK_API_KEY) return "deepseek";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "rules";
}

export function nunaUsesAI() {
  return nunaProvider() !== "rules";
}

// ---------- Lo que la IA debe devolver (igual para cualquier proveedor) ----------

const AnswerSchema = z.object({
  understood: z.boolean().describe("true si la respuesta contesta la pregunta"),
  reply: z
    .string()
    .describe("Acuse breve y cálido en español (1 oración). No hagas la siguiente pregunta."),
  text_value: z.string().nullable().describe("Valor de texto limpio para campos de texto"),
  bool_value: z.boolean().nullable().describe("Valor sí/no para campos booleanos"),
  business_type: z.enum(["products", "services", "both"]).nullable(),
  country: z.string().nullable().describe("País en español, solo para la pregunta de ubicación"),
  payment_timing: z.enum(["before", "deposit", "after", "at_sale", "credit"]).nullable(),
  currency_choice: z.enum(["local", "other", "both"]).nullable(),
  payment_methods: z.array(z.string()).nullable().describe("Formas de pago con su nombre local"),
  address_form: z.enum(["tu", "usted", "vos"]).nullable(),
  business_name: z.string().nullable().describe("Nombre del negocio si el dueño lo menciona de paso; si no, null"),
  services: z
    .array(z.object({ name: z.string(), price: z.number().nullable() }))
    .nullable()
    .describe("Productos o servicios (precio en la moneda del negocio, o null si no lo dijo), solo para esa pregunta"),
});
type Answer = z.infer<typeof AnswerSchema>;

const SYSTEM =
  "Eres Nuna, la asistente de Orbusiness. Entrevistas al dueño de un negocio pequeño para armarle su página web y su CRM. " +
  "Tu trabajo aquí es entender UNA respuesta y extraer el dato pedido. Nunca inventes datos que el dueño no dijo. " +
  "Los negocios pueden ser tiendas que venden productos, negocios de servicios, o ambos. " +
  "Si el dueño dice que la pregunta no aplica a su negocio, NO repitas la pregunta: marca understood=true y elige el valor que corresponde " +
  "(por ejemplo, una tienda que no hace trabajos no visita antes de cotizar: bool_value=false; una tienda que cobra al vender: payment_timing=at_sale). " +
  "Solo si la respuesta no tiene nada que ver con la pregunta, marca understood=false y en reply pide el dato de forma amable. " +
  "Entiende las palabras y costumbres del país del negocio (por ejemplo, en Nicaragua 'pesos' son córdobas y 'fiado' es crédito). " +
  "En reply habla en español natural de ese país, cálido y breve; nunca uses 'vosotros'. " +
  "Si el dueño menciona de paso el nombre de su negocio, ponlo en business_name. " +
  "Si el dato es ambiguo (por ejemplo, un horario sin am o pm, o 'los dos' sin decir cuáles), marca understood=false y en reply pregunta solo eso. " +
  "Si el dueño dice varias opciones (por ejemplo, 'los tres'), elige la más común y no repreguntes. " +
  "En reply no digas que anotaste datos distintos del que se pidió (excepto el nombre del negocio).";

function userPrompt(key: QuestionKey, answer: string, b: B) {
  const q = questionFor(key)!;
  const kind = { products: "tienda (vende productos)", services: "servicios", both: "productos y servicios" }[b.business_type ?? ""];
  const market = marketContext(marketFor(b.country_code));
  const known = [
    b.name && b.name !== "Mi negocio" ? `Negocio: ${b.name}` : null,
    b.industry ? `Giro: ${b.industry}` : null,
    b.owner_name ? `Dueño: ${b.owner_name}` : null,
  ].filter(Boolean);
  const form = { tu: "tú", usted: "usted", vos: "vos" }[ownerForm(b)];
  return (
    `Háblale al dueño de ${form}.\n` +
    `${known.length ? `Lo que ya sabes del negocio (úsalo, no lo vuelvas a preguntar): ${known.join("; ")}.\n` : ""}` +
    `${market ? `${market}\n` : ""}` +
    `${kind ? `Tipo de negocio: ${kind}.\n` : ""}` +
    `Pregunta (${key}): ${q.text(b)}\nQué hay que extraer: ${q.hint(b)}\n\nRespuesta del dueño:\n${answer}`
  );
}

const TEXT_FIELD: Partial<Record<QuestionKey, keyof BusinessPatch>> = {
  name: "name",
  owner: "owner_name",
  industry: "industry",
  hours: "hours",
  address: "address",
  lead_sources: "lead_sources",
};
const BOOL_FIELD: Partial<Record<QuestionKey, keyof BusinessPatch>> = {
  visit_before_quote: "visit_before_quote",
  offers_delivery: "offers_delivery",
  has_recurring_clients: "has_recurring_clients",
  quote_requires_approval: "quote_requires_approval",
};

// Convierte la respuesta de la IA en cambios para el negocio.
function toExtraction(key: QuestionKey, out: Answer, b: B): Extraction {
  const result = extractMain(key, out, b);
  // El nombre del negocio dicho de paso se guarda aunque la respuesta principal no sirva.
  const name = key !== "name" ? out.business_name?.trim() : null;
  if (!name) return result;
  return { ...result, patch: { ...(result.patch ?? {}), name } } as Extraction;
}

function extractMain(key: QuestionKey, out: Answer, b: B): Extraction {
  if (!out.understood) return { ok: false, ack: out.reply };

  const patch: BusinessPatch = {};
  const textField = TEXT_FIELD[key];
  const boolField = BOOL_FIELD[key];
  if (textField) {
    if (!out.text_value?.trim()) return { ok: false, ack: out.reply };
    Object.assign(patch, { [textField]: out.text_value.trim() });
  }
  if (boolField) {
    if (out.bool_value === null) return { ok: false, ack: out.reply };
    Object.assign(patch, { [boolField]: out.bool_value });
  }
  if (key === "location") {
    const place = out.text_value?.trim() || out.country?.trim();
    if (!place) return { ok: false, ack: out.reply };
    const check = locationCheck(out.text_value?.trim() ?? place, out.country?.trim() || null);
    if (!check.ok) return check;
    Object.assign(patch, check.patch);
  }
  if (key === "currencies") {
    if (!out.currency_choice) return { ok: false, ack: out.reply };
    Object.assign(patch, currencyPatch(out.currency_choice, b));
  }
  if (key === "phone") {
    const phone = normalizePhone(out.text_value ?? "", marketFor(b.country_code));
    if (!phone)
      return {
        ok: false,
        ack: "No estoy segura de qué país es ese número. ¿Me lo escribes con el código de país? Por ejemplo: +505 8888 7777.",
      };
    patch.phone = phone;
  }
  if (key === "payment_methods") {
    const methods = (out.payment_methods ?? []).map((m) => m.trim()).filter(Boolean);
    if (!methods.length) return { ok: false, ack: out.reply };
    patch.payment_methods = methods;
  }
  if (key === "address_form") {
    const form = out.address_form ?? marketFor(b.country_code)?.addressForm ?? null;
    if (!form) return { ok: false, ack: out.reply };
    patch.address_form = form;
  }
  if (key === "business_type") {
    if (!out.business_type) return { ok: false, ack: out.reply };
    patch.business_type = out.business_type;
  }
  if (key === "payment_timing") {
    if (!out.payment_timing) return { ok: false, ack: out.reply };
    patch.payment_timing = out.payment_timing;
  }
  if (key === "offerings") {
    const services = (out.services ?? [])
      .filter((s) => s.name.trim() && (s.price === null || s.price >= 0))
      .map((s) => ({ name: s.name.trim(), price: s.price }));
    if (!services.length) return { ok: false, ack: out.reply };
    return { ok: true, ack: out.reply, patch, services };
  }
  return { ok: true, ack: out.reply, patch };
}

// ---------- DeepSeek (API compatible con el formato de chat de OpenAI) ----------

// DEEPSEEK_BASE_URL permite usar DeepSeek desde otro proveedor compatible (por ejemplo, con servidores en EE.UU.).
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
// El "modo pensar" de DeepSeek viene activado y hace las respuestas muy lentas (y a veces las corta).
// Nuna responde mejor y más rápido sin él. Con DEEPSEEK_THINKING=enabled se vuelve a activar.
const deepseekThinking = () => ({ type: process.env.DEEPSEEK_THINKING === "enabled" ? "enabled" : "disabled" });

// Pedido a DeepSeek. Si rechaza la opción "thinking" (algún proveedor compatible no la conoce),
// se repite sin ella.
async function deepseekFetch(body: Record<string, unknown>, timeoutMs: number) {
  const send = (b: Record<string, unknown>) =>
    fetch(`${DEEPSEEK_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      body: JSON.stringify(b),
      signal: AbortSignal.timeout(timeoutMs),
    });
  const res = await send(body);
  if (res.status !== 400 || !("thinking" in body)) return res;
  const { thinking: _ignored, ...rest } = body;
  void _ignored;
  return send(rest);
}
const JSON_EXAMPLE =
  '{"understood": true, "reply": "Anotado.", "text_value": "Ferretería El Martillo", "bool_value": null, "business_type": null, "country": null, "payment_timing": null, "services": null, "currency_choice": null, "payment_methods": null, "address_form": null, "business_name": null}';

// DeepSeek a veces devuelve vacío: se reintenta una vez antes de caer a las reglas.
async function askDeepSeek(key: QuestionKey, answer: string, b: B): Promise<Answer> {
  try {
    return await askDeepSeekOnce(key, answer, b);
  } catch (error) {
    console.warn("Nuna (deepseek) reintenta:", error);
    return askDeepSeekOnce(key, answer, b);
  }
}

async function askDeepSeekOnce(key: QuestionKey, answer: string, b: B): Promise<Answer> {
  const response = await deepseekFetch(
    {
      model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
      max_tokens: 2000,
      response_format: { type: "json_object" },
      thinking: deepseekThinking(),
      messages: [
        {
          role: "system",
          content:
            `${SYSTEM}\n\nResponde solo con un objeto json con estas claves: ` +
            "understood (boolean), reply (string), text_value (string o null), bool_value (boolean o null), " +
            'business_type ("products", "services", "both" o null), country (string o null), ' +
            'payment_timing ("before", "deposit", "after", "at_sale", "credit" o null), services (lista de {"name", "price"} donde price es número o null, o null), ' +
            'currency_choice ("local", "other", "both" o null), payment_methods (lista de textos o null), address_form ("tu", "usted", "vos" o null), business_name (string o null). ' +
            `Ejemplo de json: ${JSON_EXAMPLE}`,
        },
        { role: "user", content: userPrompt(key, answer, b) },
      ],
    },
    30_000,
  );
  if (!response.ok) throw new Error(`DeepSeek respondió ${response.status}: ${await response.text()}`);

  const data = (await response.json()) as { choices?: { message?: { content?: string | null } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek devolvió una respuesta vacía");
  return AnswerSchema.parse(JSON.parse(content));
}

// ---------- Claude ----------

let anthropicClient: Anthropic | null = null;

async function askClaude(key: QuestionKey, answer: string, b: B): Promise<Answer> {
  anthropicClient ??= new Anthropic();
  const response = await anthropicClient.messages.parse({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 2000,
    output_config: { effort: "low", format: zodOutputFormat(AnswerSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt(key, answer, b) }],
  });
  if (!response.parsed_output) throw new Error("Claude no devolvió una respuesta válida");
  return response.parsed_output;
}

// ---------- Respuesta estructurada genérica (para el kit de marca y otras tareas) ----------

export async function aiJson<T>(opts: {
  system: string;
  user: string;
  schema: z.ZodType<T>;
  jsonHint: string; // descripción de las claves y un ejemplo, para DeepSeek
  maxTokens?: number;
  temperature?: number; // solo DeepSeek (más alto = más creativo)
}): Promise<T | null> {
  const provider = nunaProvider();
  if (provider === "rules") return null;
  try {
    if (provider === "anthropic") {
      anthropicClient ??= new Anthropic();
      const response = await anthropicClient.messages.parse({
        model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
        max_tokens: opts.maxTokens ?? 4000,
        output_config: { effort: "low", format: zodOutputFormat(opts.schema) },
        system: opts.system,
        messages: [{ role: "user", content: opts.user }],
      });
      return response.parsed_output ?? null;
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await deepseekFetch(
        {
          model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
          max_tokens: opts.maxTokens ?? 4000,
          ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
          response_format: { type: "json_object" },
          thinking: deepseekThinking(),
          messages: [
            { role: "system", content: `${opts.system}\n\nResponde solo con un objeto json. ${opts.jsonHint}` },
            { role: "user", content: opts.user },
          ],
        },
        90_000,
      );
      if (!response.ok) throw new Error(`DeepSeek respondió ${response.status}: ${await response.text()}`);
      const data = (await response.json()) as { choices?: { message?: { content?: string | null } }[] };
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;
      // A veces la respuesta llega cortada o con texto alrededor: se intenta rescatar el JSON y,
      // si no se puede, se pide de nuevo.
      let raw: unknown;
      try {
        raw = JSON.parse(content.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
      } catch {
        console.error("Nuna (deepseek): respuesta JSON incompleta, se pide de nuevo.");
        continue;
      }
      const parsed = opts.schema.safeParse(raw);
      if (parsed.success) return parsed.data;
      console.error("Nuna (deepseek): la respuesta no tiene el formato esperado:", parsed.error.issues.slice(0, 3));
    }
    return null;
  } catch (error) {
    console.error(`Nuna (${provider}) falló en aiJson:`, error);
    return null;
  }
}

// ---------- Punto de entrada ----------

export async function extractAnswer(key: QuestionKey, answer: string, b: B): Promise<Extraction> {
  const provider = nunaProvider();
  if (provider === "rules") return extractWithRules(key, answer, b);
  try {
    const out = provider === "deepseek" ? await askDeepSeek(key, answer, b) : await askClaude(key, answer, b);
    const result = toExtraction(key, out, b);
    return result.ok ? { ...result, ack: withoutQuestions(result.ack) } : result;
  } catch (error) {
    // Si la IA falla, Nuna no se detiene: entiende la respuesta con reglas.
    console.error(`Nuna (${provider}) falló, uso reglas:`, error);
    return extractWithRules(key, answer, b);
  }
}
