"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/business";
import { CLOSING, QUESTIONS, extractWithRules, questionIndex, type Extraction } from "@/lib/interview";
import { extractAnswer } from "@/lib/nuna";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function currentStepKey(supabase: Supabase, businessId: string) {
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

// Guarda lo que Nuna entendió y escribe su siguiente mensaje.
async function applyExtraction(
  supabase: Supabase,
  businessId: string,
  userId: string,
  stepIndex: number,
  result: Extraction,
  ownerName: string | null,
) {
  const q = QUESTIONS[stepIndex];
  if (!result.ok) {
    await supabase
      .from("interview_messages")
      .insert({ business_id: businessId, role: "nuna", step_key: q.key, content: result.ack });
    return;
  }

  if (Object.keys(result.patch).length) {
    const { error } = await supabase.from("businesses").update(result.patch).eq("id", businessId);
    if (error) throw new Error(error.message);
  }
  if (result.services) {
    await supabase.from("services").delete().eq("business_id", businessId);
    const { error } = await supabase
      .from("services")
      .insert(result.services.map((s, i) => ({ business_id: businessId, name: s.name, price: s.price, sort: i })));
    if (error) throw new Error(error.message);
  }
  await supabase.from("audit_log").insert({
    business_id: businessId,
    actor: "nuna",
    actor_user_id: userId,
    action: "interview.answer_saved",
    data: { step: q.key, patch: result.patch, services: result.services ?? null },
  });

  const next = QUESTIONS[stepIndex + 1];
  if (next) {
    await supabase
      .from("interview_messages")
      .insert({ business_id: businessId, role: "nuna", step_key: next.key, content: `${result.ack} ${next.text}` });
  } else {
    const owner = (result.patch.owner_name as string | undefined) ?? ownerName;
    await supabase
      .from("interview_messages")
      .insert({ business_id: businessId, role: "nuna", step_key: "done", content: `${result.ack} ${CLOSING(owner)}` });
    await supabase.from("businesses").update({ onboarding_step: "brand" }).eq("id", businessId);
  }
}

export async function answerInterview(text: string) {
  const answer = text.trim().slice(0, 2000);
  if (!answer) return;
  const { supabase, user, business } = await requireBusiness();

  const key = await currentStepKey(supabase, business.id);
  const index = questionIndex(key);
  if (index < 0) return; // entrevista terminada

  await supabase
    .from("interview_messages")
    .insert({ business_id: business.id, role: "owner", step_key: key, content: answer });
  const result = await extractAnswer(QUESTIONS[index].key, answer);
  await applyExtraction(supabase, business.id, user.id, index, result, business.owner_name);
  revalidatePath("/onboarding", "layout");
}

// Atajo para demos: contesta lo que falta con el ejemplo de Ricardo el jardinero.
export async function fillWithExample() {
  const { supabase, user, business } = await requireBusiness();
  let index = questionIndex(await currentStepKey(supabase, business.id));
  let owner = business.owner_name;
  while (index >= 0 && index < QUESTIONS.length) {
    const q = QUESTIONS[index];
    await supabase
      .from("interview_messages")
      .insert({ business_id: business.id, role: "owner", step_key: q.key, content: q.example });
    const result = extractWithRules(q.key, q.example);
    if (result.ok && result.patch.owner_name) owner = result.patch.owner_name as string;
    await applyExtraction(supabase, business.id, user.id, index, result, owner);
    index += 1;
  }
  revalidatePath("/onboarding", "layout");
}
