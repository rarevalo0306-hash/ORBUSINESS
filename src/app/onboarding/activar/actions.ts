"use server";

import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/business";

export async function activate() {
  const { supabase, user, business } = await requireBusiness();
  await supabase.from("businesses").update({ status: "active", onboarding_step: "done" }).eq("id", business.id);
  await supabase.from("audit_log").insert({
    business_id: business.id,
    actor: "owner",
    actor_user_id: user.id,
    action: "business.activated",
  });
  redirect("/panel");
}
