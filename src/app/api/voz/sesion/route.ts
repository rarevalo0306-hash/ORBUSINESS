import { realtimeClientSecret, realtimeEnabled, underDailyLimit } from "@/lib/voice-ai";
import { createClient } from "@/lib/supabase/server";

// Llave temporal para conversar por voz en tiempo real con OpenAI (solo para el dueño con sesión).
export async function POST() {
  if (!realtimeEnabled()) return Response.json({ error: "Voz en tiempo real no configurada" }, { status: 404 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Inicia sesión" }, { status: 401 });
  const { data: b } = await supabase.from("businesses").select("id, name, industry, zone, owner_name, country").order("created_at").limit(1).maybeSingle();
  if (!b) return Response.json({ error: "Sin negocio" }, { status: 404 });
  if (!(await underDailyLimit(supabase, b.id, "voice.realtime"))) return Response.json({ error: "Límite de voz de hoy alcanzado" }, { status: 429 });

  const prompt =
    `Entrevista en español a ${b.owner_name ?? "el dueño"} sobre su negocio${b.name && b.name !== "Mi negocio" ? ` "${b.name}"` : ""}${b.industry ? ` (${b.industry})` : ""}${b.zone ? ` en ${b.zone}` : ""}. ` +
    "Puede decir nombres de negocios, calles o productos en inglés (por ejemplo: Florida Flooring Solutions, Main Street); escríbelos en inglés tal cual.";
  const key = await realtimeClientSecret({ country: b.country, prompt }).catch(() => null);
  if (!key) return Response.json({ error: "No se pudo iniciar la voz" }, { status: 502 });
  await supabase.from("audit_log").insert({ business_id: b.id, actor: "owner", actor_user_id: user.id, action: "voice.realtime", data: {} });
  return Response.json({ key }, { headers: { "Cache-Control": "no-store" } });
}
