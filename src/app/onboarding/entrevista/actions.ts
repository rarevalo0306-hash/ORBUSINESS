"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/business";
import {
  CLOSING,
  QUESTIONS,
  answeredKeysOf,
  describeAnswer,
  industryFromName,
  missingQuestions,
  questionFor,
  type BusinessPatch,
  type BusinessRow,
  type Extraction,
  type QuestionKey,
} from "@/lib/interview";
import { converse, extractAnswer, factAnswer, factExtraction, nunaUsesAI } from "@/lib/nuna";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// El paso actual se guarda en el último mensaje de Nuna:
//   "<pregunta>"                 entrevista normal
//   "fix:<pregunta>><regreso>"   corrigiendo un dato; luego vuelve a <regreso>
//   "done"                       entrevista terminada
async function currentStep(supabase: Supabase, businessId: string) {
  const { data } = await supabase
    .from("interview_messages")
    .select("step_key")
    .eq("business_id", businessId)
    .eq("role", "nuna")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.step_key ?? QUESTIONS[0].key;
}

function parseStep(step: string): { key: string; fixing: boolean; resume: string | null } {
  if (step.startsWith("fix:")) {
    const [key, resume] = step.slice(4).split(">");
    return { key, fixing: true, resume: resume ?? "done" };
  }
  return { key: step, fixing: false, resume: null };
}

function nuna(supabase: Supabase, businessId: string, step: string, content: string) {
  return supabase.from("interview_messages").insert({ business_id: businessId, role: "nuna", step_key: step, content });
}

// Guarda lo que Nuna entendió y devuelve el negocio actualizado.
async function saveExtraction(
  supabase: Supabase,
  business: BusinessRow,
  userId: string,
  key: QuestionKey,
  result: Extract<Extraction, { ok: true }>,
): Promise<BusinessRow> {
  let updated = business;
  if (Object.keys(result.patch).length) {
    const { data, error } = await supabase.from("businesses").update(result.patch).eq("id", business.id).select("*").single();
    if (error) throw new Error(error.message);
    updated = data;
  }
  if (result.services) {
    await supabase.from("services").delete().eq("business_id", business.id);
    const { error } = await supabase
      .from("services")
      .insert(result.services.map((s, i) => ({ business_id: business.id, name: s.name, price: s.price, sort: i })));
    if (error) throw new Error(error.message);
  }
  await supabase.from("audit_log").insert({
    business_id: business.id,
    actor: "nuna",
    actor_user_id: userId,
    action: "interview.answer_saved",
    data: { step: key, patch: result.patch, services: result.services ?? null },
  });
  return updated;
}

export async function answerInterview(text: string) {
  const answer = text.trim().slice(0, 2000);
  if (!answer) return;
  const { supabase, user, business } = await requireBusiness();

  const step = await currentStep(supabase, business.id);
  if (step === "done") return; // entrevista terminada
  // Con IA, Nuna platica libremente y llena todo con lo que escuchó; si la IA falla, sigue por pasos.
  if (nunaUsesAI() && (await chatTurn(supabase, user.id, business, answer))) return;

  const parsed = parseStep(step);
  const fixing = parsed.fixing;
  const q = questionFor(parsed.key) ?? (await missingFor(supabase, business))[0] ?? null;
  if (!q) return;
  const key = q.key;

  // La respuesta anterior y lo que Nuna anotó: si el dueño dice "no, así no es", se corrige eso.
  const previous = fixing ? undefined : await previousAnswer(supabase, business, key);
  await supabase.from("interview_messages").insert({ business_id: business.id, role: "owner", step_key: step, content: answer });
  const result = await extractAnswer(q.key, answer, business, previous);
  if (!result.ok && result.correctsPrevious && previous) {
    const prevQ = questionFor(previous.key)!;
    const fix = await extractAnswer(prevQ.key, answer, business);
    if (fix.ok) {
      const updated = await saveExtraction(supabase, business, user.id, prevQ.key, fix);
      await nuna(supabase, business.id, step, `${fix.ack} Gracias por corregirme. ${q.text(updated)}`);
    } else {
      // No quedó claro el dato corregido: lo pregunta de nuevo y después vuelve a donde iba.
      await nuna(supabase, business.id, `fix:${prevQ.key}>${step}`, `Perdón, corrijamos eso. ${prevQ.text(business)}`);
    }
    revalidatePath("/onboarding", "layout");
    return;
  }
  if (!result.ok) {
    if (result.patch && Object.keys(result.patch).length) {
      await supabase.from("businesses").update(result.patch).eq("id", business.id);
      await supabase.from("audit_log").insert({
        business_id: business.id,
        actor: "nuna",
        actor_user_id: user.id,
        action: "interview.extra_saved",
        data: { step: q.key, patch: result.patch },
      });
    }
    await nuna(supabase, business.id, step, result.ack);
    revalidatePath("/onboarding", "layout");
    return;
  }
  let updated = await saveExtraction(supabase, business, user.id, q.key, result);

  // Si el nombre ya dice el giro ("Ferretería Arévalo"), no se pregunta a qué se dedica.
  if (q.key === "name" && !updated.industry) {
    const industry = industryFromName(updated.name);
    if (industry) {
      const { data } = await supabase.from("businesses").update({ industry }).eq("id", business.id).select("*").single();
      if (data) updated = data;
    }
  }

  // Siguiente: lo primero que falte (así una corrección o un cambio de tipo de negocio
  // hace que Nuna pregunte lo que ahora aplica).
  const next = (await missingFor(supabase, updated))[0];
  if (next) {
    const lead = fixing ? `${result.ack} Listo, corregido. Sigamos:` : result.ack;
    await nuna(supabase, business.id, next.key, `${lead} ${next.text(updated)}`);
  } else if (updated.onboarding_step === "interview") {
    await nuna(supabase, business.id, "done", `${result.ack} ${CLOSING(updated.owner_name, updated)}`);
    await supabase.from("businesses").update({ onboarding_step: "brand" }).eq("id", business.id);
  } else {
    await nuna(supabase, business.id, "done", `${result.ack} Listo, ya quedó todo actualizado.`);
  }
  revalidatePath("/onboarding", "layout");
}

// La última pregunta YA contestada antes de la actual (se saltan los intentos fallidos de la actual).
async function previousAnswer(supabase: Supabase, b: BusinessRow, currentKey: string) {
  const [{ data: recent }, { data: services }] = await Promise.all([
    supabase
      .from("interview_messages")
      .select("step_key")
      .eq("business_id", b.id)
      .eq("role", "owner")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("services").select("name, price").eq("business_id", b.id),
  ]);
  const prevKey = (recent ?? []).map((m) => parseStep(m.step_key ?? "").key).find((k) => k !== currentKey);
  const prevQ = questionFor(prevKey ?? null);
  if (!prevQ) return undefined;
  return { key: prevQ.key, understood: describeAnswer(prevQ.key, b, services ?? [], true) };
}

// Un turno de la plática libre. Devuelve false si la IA no respondió (para seguir por pasos).
async function chatTurn(supabase: Supabase, userId: string, business: BusinessRow, answer: string): Promise<boolean> {
  const [{ data: history }, { data: services }, missing] = await Promise.all([
    supabase.from("interview_messages").select("role, content").eq("business_id", business.id).order("created_at"),
    supabase.from("services").select("name, price").eq("business_id", business.id).order("sort"),
    missingFor(supabase, business),
  ]);
  const known = QUESTIONS.map((q) => [q.label, describeAnswer(q.key, business, services ?? [], true)] as const)
    .filter(([, v]) => v)
    .map(([l, v]) => `${l}: ${v}`);
  const ask = (q: (typeof QUESTIONS)[number], b: BusinessRow) => (q.key === "owner" ? "¿Cómo te llamas?" : q.text(b));
  const out = await converse({
    b: business,
    history: [...(history ?? []), { role: "owner", content: answer }],
    known,
    missing: missing.map((q) => ({ label: q.label, hint: q.hint(business), ask: ask(q, business) })),
  });
  if (!out) return false;

  // Llena todo lo que se dijo en la plática (con las mismas validaciones de siempre), en orden:
  // el país va antes que el teléfono y la moneda.
  let b = business;
  const patch: BusinessPatch = {};
  const filled: QuestionKey[] = [];
  let newServices: { name: string; price: number | null }[] | null = null;
  for (const q of QUESTIONS) {
    const fact = factAnswer(q.key, out.facts);
    if (!fact) continue;
    const ex = factExtraction(q.key, fact, b);
    if (!ex.ok) continue;
    filled.push(q.key);
    const changed = Object.entries(ex.patch).filter(([k, v]) => JSON.stringify(b[k as keyof BusinessRow]) !== JSON.stringify(v));
    if (changed.length) {
      Object.assign(patch, Object.fromEntries(changed));
      b = { ...b, ...Object.fromEntries(changed) };
    }
    if (ex.services && JSON.stringify(ex.services) !== JSON.stringify((services ?? []).map((s) => ({ name: s.name, price: s.price === null ? null : Number(s.price) })))) {
      newServices = ex.services;
    }
  }
  if (patch.name && !b.industry) {
    const industry = industryFromName(String(patch.name));
    if (industry) {
      patch.industry = industry;
      b = { ...b, industry };
    }
  }

  let updated = business;
  if (Object.keys(patch).length) {
    const { data, error } = await supabase.from("businesses").update(patch).eq("id", business.id).select("*").single();
    if (error) throw new Error(error.message);
    updated = data;
  }
  if (newServices) {
    await supabase.from("services").delete().eq("business_id", business.id);
    const { error } = await supabase
      .from("services")
      .insert(newServices.map((s, i) => ({ business_id: business.id, name: s.name, price: s.price, sort: i })));
    if (error) throw new Error(error.message);
  }
  await supabase.from("interview_messages").insert({ business_id: business.id, role: "owner", step_key: `chat|${filled.join(",")}`, content: answer });
  if (Object.keys(patch).length || newServices) {
    await supabase.from("audit_log").insert({
      business_id: business.id,
      actor: "nuna",
      actor_user_id: userId,
      action: "interview.chat_saved",
      data: { patch, services: newServices } as never,
    });
  }

  const still = await missingFor(supabase, updated);
  if (!still.length) {
    if (updated.onboarding_step === "interview") {
      await nuna(supabase, business.id, "done", CLOSING(updated.owner_name, updated));
      await supabase.from("businesses").update({ onboarding_step: "brand" }).eq("id", business.id);
    } else {
      await nuna(supabase, business.id, "done", `${out.reply} Listo, ya quedó todo actualizado.`);
    }
  } else {
    // Si la IA cerró antes de tiempo, Nuna sigue con lo que falta.
    const reply = out.finished || !out.reply.includes("?") ? `${out.reply} ${ask(still[0], updated)}` : out.reply;
    await nuna(supabase, business.id, "chat", reply.trim());
  }
  revalidatePath("/onboarding", "layout");
  return true;
}

async function missingFor(supabase: Supabase, b: BusinessRow) {
  const [{ data: services }, { data: answered }] = await Promise.all([
    supabase.from("services").select("name, price").eq("business_id", b.id),
    supabase.from("interview_messages").select("step_key").eq("business_id", b.id).eq("role", "owner"),
  ]);
  const keys = new Set((answered ?? []).flatMap((m) => answeredKeysOf(m.step_key)));
  return missingQuestions(b, services ?? [], keys);
}

// Entrevistas que ya terminaron pero a las que les faltan datos nuevos (por ejemplo, país o WhatsApp).
export async function completeMissing() {
  const { supabase, business } = await requireBusiness();
  const next = (await missingFor(supabase, business))[0];
  if (!next) return;
  await nuna(supabase, business.id, next.key, `Me faltan unos datos para dejar todo listo. ${next.text(business)}`);
  revalidatePath("/onboarding", "layout");
}

// "Corregir": Nuna vuelve a hacer una pregunta y después regresa a donde iba.
export async function startFix(key: string) {
  const { supabase, business } = await requireBusiness();
  const q = questionFor(key);
  if (!q || (q.applies && !q.applies(business))) return;
  const { key: current, fixing, resume } = parseStep(await currentStep(supabase, business.id));
  const back = fixing ? resume : current;
  await nuna(supabase, business.id, `fix:${q.key}>${back}`, `Claro, corrijamos eso. ${q.text(business)}`);
  revalidatePath("/onboarding", "layout");
}

// "Empezar de nuevo": borra lo que Nuna entendió y repite la entrevista.
export async function restartInterview() {
  const { supabase, user, business } = await requireBusiness();
  await supabase.from("interview_messages").delete().eq("business_id", business.id);
  await supabase.from("services").delete().eq("business_id", business.id);
  await supabase
    .from("businesses")
    .update({
      name: "Mi negocio",
      owner_name: null,
      industry: null,
      zone: null,
      country: null,
      country_code: null,
      currency: "USD",
      secondary_currency: null,
      phone: null,
      address: null,
      payment_methods: [],
      address_form: null,
      hours: null,
      business_type: null,
      lead_sources: null,
      visit_before_quote: null,
      payment_timing: null,
      offers_delivery: null,
      has_recurring_clients: null,
      quote_requires_approval: true,
      onboarding_step: "interview",
    })
    .eq("id", business.id);
  await nuna(supabase, business.id, QUESTIONS[0].key, QUESTIONS[0].text(business));
  await supabase.from("audit_log").insert({
    business_id: business.id,
    actor: "owner",
    actor_user_id: user.id,
    action: "interview.restarted",
  });
  revalidatePath("/onboarding", "layout");
}
