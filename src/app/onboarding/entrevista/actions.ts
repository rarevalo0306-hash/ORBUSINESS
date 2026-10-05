"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/business";
import {
  CLOSING,
  QUESTIONS,
  industryFromName,
  missingQuestions,
  questionFor,
  type BusinessRow,
  type Extraction,
  type QuestionKey,
} from "@/lib/interview";
import { extractAnswer } from "@/lib/nuna";
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
  const { key, fixing } = parseStep(step);
  const q = questionFor(key);
  if (!q) return; // entrevista terminada

  await supabase.from("interview_messages").insert({ business_id: business.id, role: "owner", step_key: step, content: answer });
  const result = await extractAnswer(q.key, answer, business);
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

async function missingFor(supabase: Supabase, b: BusinessRow) {
  const [{ data: services }, { data: answered }] = await Promise.all([
    supabase.from("services").select("name, price").eq("business_id", b.id),
    supabase.from("interview_messages").select("step_key").eq("business_id", b.id).eq("role", "owner"),
  ]);
  const keys = new Set((answered ?? []).map((m) => parseStep(m.step_key ?? "").key));
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
