import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Usuario con sesión + su negocio (RLS solo deja ver negocios donde es miembro).
export async function getOwnerContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  return { supabase, user, business };
}

export async function requireBusiness() {
  const ctx = await getOwnerContext();
  if (!ctx.business) redirect("/onboarding");
  return { ...ctx, business: ctx.business };
}

export const STEP_ROUTES: Record<string, string> = {
  interview: "/onboarding/entrevista",
  brand: "/onboarding/marca",
  website: "/onboarding/web",
  crm: "/onboarding/crm",
  activate: "/onboarding/activar",
  done: "/panel",
};

export function publicAssetUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/brand-assets/${path}`;
}
