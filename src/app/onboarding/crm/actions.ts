"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/business";
import { stagesFor } from "@/lib/crm";

// Crea (o vuelve a crear) las etapas del CRM según el workflow del negocio.
export async function createCrm() {
  const { supabase, user, business } = await requireBusiness();
  const stages = stagesFor(business);

  // Los contactos que ya existan se quedan; si su etapa desaparece, quedan sin etapa y se pasan a la primera.
  const { data: oldStages } = await supabase.from("pipeline_stages").select("id, key").eq("business_id", business.id);
  const keptKeys = new Set(stages.map((s) => s.key));
  const toDelete = (oldStages ?? []).filter((s) => !keptKeys.has(s.key)).map((s) => s.id);
  if (toDelete.length) await supabase.from("pipeline_stages").delete().in("id", toDelete);

  // Reordenar sin chocar con la regla "posición única": primero posiciones temporales.
  if (oldStages?.length) {
    for (const [i, s] of oldStages.entries()) {
      if (keptKeys.has(s.key)) await supabase.from("pipeline_stages").update({ position: 1000 + i }).eq("id", s.id);
    }
  }
  const { data: saved, error } = await supabase
    .from("pipeline_stages")
    .upsert(
      stages.map((s, i) => ({
        business_id: business.id,
        key: s.key,
        name: s.name,
        position: i,
        automations: s.automations,
      })),
      { onConflict: "business_id,key" },
    )
    .select("id, position");
  if (error) throw new Error(error.message);

  const first = saved?.find((s) => s.position === 0);
  if (first) await supabase.from("contacts").update({ stage_id: first.id }).eq("business_id", business.id).is("stage_id", null);

  if (business.onboarding_step === "crm") {
    await supabase.from("businesses").update({ onboarding_step: "activate" }).eq("id", business.id);
  }
  await supabase.from("audit_log").insert({
    business_id: business.id,
    actor: "owner",
    actor_user_id: user.id,
    action: "crm.created",
    data: { stages: stages.map((s) => s.name) },
  });
  revalidatePath("/onboarding", "layout");
  redirect("/onboarding/activar");
}
