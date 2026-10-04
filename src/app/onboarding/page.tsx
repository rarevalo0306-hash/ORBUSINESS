import { redirect } from "next/navigation";
import { STEP_ROUTES, getOwnerContext } from "@/lib/business";
import { QUESTIONS } from "@/lib/interview";

// Punto de entrada del alta: crea el negocio la primera vez y lleva al paso pendiente.
export default async function OnboardingPage() {
  const { supabase, user, business } = await getOwnerContext();

  if (!business) {
    const { data: businessId, error } = await supabase.rpc("create_business", { p_name: "Mi negocio" });
    if (error || !businessId) throw new Error(`No se pudo crear el negocio: ${error?.message}`);
    await supabase.from("interview_messages").insert({
      business_id: businessId,
      role: "nuna",
      step_key: QUESTIONS[0].key,
      content: QUESTIONS[0].text,
    });
    await supabase.from("audit_log").insert({
      business_id: businessId,
      actor: "owner",
      actor_user_id: user.id,
      action: "onboarding.started",
    });
    redirect(STEP_ROUTES.interview);
  }

  redirect(STEP_ROUTES[business.onboarding_step] ?? STEP_ROUTES.interview);
}
