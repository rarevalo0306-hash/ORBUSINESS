import { aiVoiceEnabled, transcribe, underDailyLimit } from "@/lib/voice-ai";
import { createClient } from "@/lib/supabase/server";

// Lo que dice el dueño en la entrevista → texto (OpenAI). El navegador manda la grabación.
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;
const EXT: Record<string, string> = { "audio/webm": "webm", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg" };

export async function POST(request: Request) {
  if (!aiVoiceEnabled()) return Response.json({ error: "Voz con IA no configurada" }, { status: 404 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Inicia sesión" }, { status: 401 });
  const { data: b } = await supabase.from("businesses").select("id, name, industry, zone, owner_name").order("created_at").limit(1).maybeSingle();
  if (!b) return Response.json({ error: "Sin negocio" }, { status: 404 });
  if (!(await underDailyLimit(supabase, b.id, "voice.stt"))) return Response.json({ error: "Límite de voz de hoy alcanzado" }, { status: 429 });

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!(audio instanceof Blob) || audio.size < 800) return Response.json({ text: "" });
  if (audio.size > MAX_BYTES) return Response.json({ error: "La grabación es muy larga" }, { status: 413 });
  const type = audio.type.split(";")[0];
  const ext = EXT[type] ?? "webm";

  // Contexto para escribir bien nombres y palabras locales: el negocio y la pregunta que se contesta.
  const { data: last } = await supabase
    .from("interview_messages")
    .select("content")
    .eq("business_id", b.id)
    .eq("role", "nuna")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const prompt = [
    `Entrevista en español a ${b.owner_name ?? "el dueño"} sobre su negocio${b.name ? ` "${b.name}"` : ""}${b.industry ? ` (${b.industry})` : ""}${b.zone ? ` en ${b.zone}` : ""}.`,
    last?.content ? `Pregunta: ${last.content}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const text = await transcribe(audio, `respuesta.${ext}`, prompt).catch(() => null);
  if (text === null) return Response.json({ error: "No pude entender el audio" }, { status: 502 });
  await supabase.from("audit_log").insert({ business_id: b.id, actor: "owner", actor_user_id: user.id, action: "voice.stt", data: { bytes: audio.size } });
  return Response.json({ text });
}
