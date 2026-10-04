import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  QUESTIONS,
  extractWithRules,
  type BusinessPatch,
  type Extraction,
  type QuestionKey,
} from "@/lib/interview";

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
  payment_timing: z.enum(["before", "deposit", "after"]).nullable(),
  services: z
    .array(z.object({ name: z.string(), price: z.number().nullable() }))
    .nullable()
    .describe("Productos o servicios (precio en dólares o null si no lo dijo), solo para esa pregunta"),
});
type Answer = z.infer<typeof AnswerSchema>;

const SYSTEM =
  "Eres Nuna, la asistente de Orbusiness. Entrevistas al dueño de un negocio pequeño para armarle su página web y su CRM. " +
  "Tu trabajo aquí es entender UNA respuesta y extraer el dato pedido. Nunca inventes datos que el dueño no dijo. " +
  "Si la respuesta no contesta la pregunta, marca understood=false y en reply pide el dato de forma amable.";

function userPrompt(key: QuestionKey, answer: string) {
  const q = QUESTIONS.find((x) => x.key === key)!;
  return `Pregunta (${key}): ${q.text}\nQué hay que extraer: ${q.hint}\n\nRespuesta del dueño:\n${answer}`;
}

const TEXT_FIELD: Partial<Record<QuestionKey, keyof BusinessPatch>> = {
  name: "name",
  owner: "owner_name",
  industry: "industry",
  zone: "zone",
  hours: "hours",
  lead_sources: "lead_sources",
};
const BOOL_FIELD: Partial<Record<QuestionKey, keyof BusinessPatch>> = {
  visit_before_quote: "visit_before_quote",
  has_recurring_clients: "has_recurring_clients",
  quote_requires_approval: "quote_requires_approval",
};

// Convierte la respuesta de la IA en cambios para el negocio.
function toExtraction(key: QuestionKey, out: Answer): Extraction {
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
  if (key === "payment_timing") {
    if (!out.payment_timing) return { ok: false, ack: out.reply };
    patch.payment_timing = out.payment_timing;
  }
  if (key === "services") {
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
const JSON_EXAMPLE =
  '{"understood": true, "reply": "Anotado.", "text_value": "Jardines Ricardo", "bool_value": null, "payment_timing": null, "services": null}';

async function askDeepSeek(key: QuestionKey, answer: string): Promise<Answer> {
  const response = await fetch(`${DEEPSEEK_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `${SYSTEM}\n\nResponde solo con un objeto json con estas claves: ` +
            "understood (boolean), reply (string), text_value (string o null), bool_value (boolean o null), " +
            'payment_timing ("before", "deposit", "after" o null), services (lista de {"name", "price"} donde price es número o null, o null). ' +
            `Ejemplo de json: ${JSON_EXAMPLE}`,
        },
        { role: "user", content: userPrompt(key, answer) },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`DeepSeek respondió ${response.status}: ${await response.text()}`);

  const data = (await response.json()) as { choices?: { message?: { content?: string | null } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek devolvió una respuesta vacía");
  return AnswerSchema.parse(JSON.parse(content));
}

// ---------- Claude ----------

let anthropicClient: Anthropic | null = null;

async function askClaude(key: QuestionKey, answer: string): Promise<Answer> {
  anthropicClient ??= new Anthropic();
  const response = await anthropicClient.messages.parse({
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
    max_tokens: 2000,
    output_config: { effort: "low", format: zodOutputFormat(AnswerSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: userPrompt(key, answer) }],
  });
  if (!response.parsed_output) throw new Error("Claude no devolvió una respuesta válida");
  return response.parsed_output;
}

// ---------- Punto de entrada ----------

export async function extractAnswer(key: QuestionKey, answer: string): Promise<Extraction> {
  const provider = nunaProvider();
  if (provider === "rules") return extractWithRules(key, answer);
  try {
    const out = provider === "deepseek" ? await askDeepSeek(key, answer) : await askClaude(key, answer);
    return toExtraction(key, out);
  } catch (error) {
    // Si la IA falla, Nuna no se detiene: entiende la respuesta con reglas.
    console.error(`Nuna (${provider}) falló, uso reglas:`, error);
    return extractWithRules(key, answer);
  }
}
