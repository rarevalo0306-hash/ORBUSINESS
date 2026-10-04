"use server";

import { createClient } from "@/lib/supabase/server";

export type LeadState = { ok?: boolean; error?: string };

// Formulario público de cotización: crea el lead en el CRM del negocio (función segura en la base).
export async function submitLead(slug: string, _prev: LeadState, formData: FormData): Promise<LeadState> {
  const value = (k: string) => String(formData.get(k) ?? "").trim();
  const name = value("name");
  const phone = value("phone");
  const email = value("email");
  if (!name) return { error: "Escribe tu nombre." };
  if (!phone && !email) return { error: "Déjanos un teléfono o un correo para contactarte." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_lead", {
    p_subdomain: slug,
    p_name: name,
    p_phone: phone,
    p_email: email,
    p_message: value("message"),
  });
  if (error) return { error: "No pudimos enviar tus datos. Intenta de nuevo." };
  return { ok: true };
}
