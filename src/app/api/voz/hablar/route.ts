import { speakable } from "@/lib/voice";
import { aiVoiceEnabled, synthesize, underDailyLimit } from "@/lib/voice-ai";
import { createClient } from "@/lib/supabase/server";

// Voz de Nuna: lee en voz alta uno de SUS mensajes de la entrevista (por id). Solo mensajes del
// propio negocio (RLS), así nadie puede usar esto para convertir cualquier texto en voz.
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!aiVoiceEnabled()) return new Response("Voz con IA no configurada", { status: 404 });
  const id = new URL(request.url).searchParams.get("m") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Mensaje no válido", { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Inicia sesión", { status: 401 });
  const { data: msg } = await supabase.from("interview_messages").select("business_id, role, content").eq("id", id).maybeSingle();
  if (!msg || msg.role === "owner") return new Response("No encontrado", { status: 404 });
  const { data: b } = await supabase.from("businesses").select("id, country").eq("id", msg.business_id).maybeSingle();
  if (!b) return new Response("No encontrado", { status: 404 });
  if (!(await underDailyLimit(supabase, b.id, "voice.tts"))) return new Response("Límite de voz de hoy alcanzado", { status: 429 });

  const text = speakable(msg.content).slice(0, 1500);
  if (!text) return new Response("Sin texto", { status: 204 });
  const res = await synthesize(text, b.country).catch(() => null);
  if (!res?.ok || !res.body) {
    if (res) console.error("OpenAI voz respondió", res.status, (await res.text()).slice(0, 300));
    return new Response("No se pudo generar la voz", { status: 502 });
  }
  await supabase.from("audit_log").insert({ business_id: b.id, actor: "owner", actor_user_id: user.id, action: "voice.tts", data: { chars: text.length } });
  return new Response(res.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400" },
  });
}
