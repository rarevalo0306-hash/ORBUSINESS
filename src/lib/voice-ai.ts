import "server-only";
import type { createClient } from "@/lib/supabase/server";

// Voz con IA de OpenAI: Nuna habla con voz natural (texto a voz) y entiende lo que dice el dueño
// (voz a texto). Sin OPENAI_API_KEY la entrevista usa la voz del navegador.
// Costo aproximado: US$0.015 por minuto de voz de Nuna y US$0.0045 por minuto transcrito.

type Supabase = Awaited<ReturnType<typeof createClient>>;

const BASE = () => process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
const KEY = () => process.env.OPENAI_API_KEY?.trim() || "";
export const aiVoiceEnabled = () => Boolean(KEY());

const TTS_MODEL = () => process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts";
const TTS_VOICE = () => process.env.OPENAI_TTS_VOICE?.trim() || "marin";
const STT_MODEL = () => process.env.OPENAI_STT_MODEL?.trim() || "gpt-transcribe";

// Límites diarios por negocio, para que nadie use la voz sin control (cada uso queda en audit_log).
export const DAILY_LIMIT = { "voice.tts": 400, "voice.stt": 300 } as const;

export async function underDailyLimit(supabase: Supabase, businessId: string, action: keyof typeof DAILY_LIMIT) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabase
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("action", action)
    .gte("created_at", since);
  return (count ?? 0) < DAILY_LIMIT[action];
}

// Cómo debe sonar Nuna.
function voiceInstructions(country: string | null) {
  return (
    `Habla en español latinoamericano${country ? `, con un acento neutro cercano al de ${country}` : ""}. ` +
    "Eres Nuna, una asesora de negocios cálida, segura y amable. Tono conversacional y natural, " +
    "ritmo tranquilo pero ágil, sonrisa en la voz. Nada de tono de locutor ni de robot."
  );
}

// Devuelve la respuesta de OpenAI tal cual, para que el audio empiece a sonar mientras llega.
export async function synthesize(text: string, country: string | null): Promise<Response> {
  return fetch(`${BASE()}/audio/speech`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: TTS_MODEL(),
      voice: TTS_VOICE(),
      input: text,
      instructions: voiceInstructions(country),
      response_format: "mp3",
    }),
    signal: AbortSignal.timeout(60_000),
  });
}

// Texto de lo que dijo el dueño. `prompt` da contexto (nombre del negocio, la pregunta) para que
// escriba bien nombres y palabras locales.
export async function transcribe(audio: Blob, filename: string, prompt: string): Promise<string | null> {
  const model = STT_MODEL();
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", model);
  if (model === "gpt-transcribe") form.append("languages[]", "es");
  else form.append("language", "es");
  if (prompt && !model.includes("diarize")) form.append("prompt", prompt.slice(0, 800));
  form.append("response_format", "json");
  const res = await fetch(`${BASE()}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY()}` },
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    console.error("OpenAI transcripción respondió", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const json = (await res.json()) as { text?: string };
  return json.text?.trim() ?? null;
}
