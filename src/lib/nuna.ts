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

const MODEL = "claude-opus-5-5";

// Nuna usa Claude solo si hay llave; si no (o si algo falla), usa las reglas de lib/interview.ts.
export function nunaUsesClaude() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const AnswerSchema = z.object({
  understood: z.boolean().describe("true si la respuesta contesta la pregunta"),
  reply: z
    .string()
    .describe("Acuse breve y cálido en español (1 oración). No hagas la siguiente pregunta."),
  text_value: z.string().nullable().describe("Valor de texto limpio para campos de texto"),
  bool_value: z.boolean().nullable().describe("Valor sí/no para campos booleanos"),
  payment_timing: z.enum(["before", "deposit", "after"]).nullable(),
  services: z
    .array(z.object({ name: z.string(), price: z.number() }))
    .nullable()
    .describe("Servicios con precio en dólares, solo para la pregunta de servicios"),
});

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

let client: Anthropic | null = null;
function anthropic() {
  client ??= new Anthropic();
  return client;
}

async function extractWithClaude(key: QuestionKey, answer: string): Promise<Extraction> {
  const q = QUESTIONS.find((x) => x.key === key)!;
  const response = await anthropic().messages.parse({
    model: MODEL,
    max_tokens: 2000,
    output_config: { effort: "low", format: zodOutputFormat(AnswerSchema) },
    system:
      "Eres Nuna, la asistente de Orbusiness. Entrevistas al dueño de un negocio pequeño para armarle su página web y su CRM. " +
      "Tu trabajo aquí es entender UNA respuesta y extraer el dato pedido. Nunca inventes datos que el dueño no dijo. " +
      "Si la respuesta no contesta la pregunta, marca understood=false y en reply pide el dato de forma amable.",
    messages: [
      {
        role: "user",
        content: `Pregunta (${key}): ${q.text}\nQué hay que extraer: ${q.hint}\n\nRespuesta del dueño:\n${answer}`,
      },
    ],
  });

  const out = response.parsed_output;
  if (!out) throw new Error("Claude no devolvió una respuesta válida");
  if (!out.understood) return { ok: false, ack: out.reply };

  const patch: BusinessPatch = {};
  const textField = TEXT_FIELD[key];
  const boolField = BOOL_FIELD[key];
  if (textField) {
    if (!out.text_value) return { ok: false, ack: out.reply };
    Object.assign(patch, { [textField]: out.text_value });
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
    const services = (out.services ?? []).filter((s) => s.name.trim() && s.price >= 0);
    if (!services.length) return { ok: false, ack: out.reply };
    return { ok: true, ack: out.reply, patch, services };
  }
  return { ok: true, ack: out.reply, patch };
}

export async function extractAnswer(key: QuestionKey, answer: string): Promise<Extraction> {
  if (!nunaUsesClaude()) return extractWithRules(key, answer);
  try {
    return await extractWithClaude(key, answer);
  } catch (error) {
    console.error("Nuna/Claude falló, uso reglas:", error);
    return extractWithRules(key, answer);
  }
}
