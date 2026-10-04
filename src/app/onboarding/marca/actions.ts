"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/business";

const KINDS = ["logo", "photo"] as const;

// El navegador ya subió el archivo a la carpeta del negocio; aquí se registra.
export async function registerAsset(kind: string, storagePath: string) {
  const { supabase, user, business } = await requireBusiness();
  if (!KINDS.includes(kind as (typeof KINDS)[number])) throw new Error("Tipo de archivo no válido");
  if (!storagePath.startsWith(`${business.id}/`)) throw new Error("Ruta no válida");

  if (kind === "logo") {
    await supabase.from("brand_assets").delete().eq("business_id", business.id).eq("kind", "logo");
  }
  const { error } = await supabase
    .from("brand_assets")
    .insert({ business_id: business.id, kind, storage_path: storagePath });
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({
    business_id: business.id,
    actor: "owner",
    actor_user_id: user.id,
    action: "brand.asset_uploaded",
    data: { kind, storagePath },
  });
  revalidatePath("/onboarding/marca");
}

export async function removeAsset(id: string) {
  const { supabase, business } = await requireBusiness();
  const { data } = await supabase
    .from("brand_assets")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id)
    .select("storage_path")
    .maybeSingle();
  if (data) await supabase.storage.from("brand-assets").remove([data.storage_path]);
  revalidatePath("/onboarding/marca");
}

const SOURCES = ["new", "keep_existing", "rebuild"] as const;

export async function saveBrand(formData: FormData) {
  const { supabase, user, business } = await requireBusiness();
  const source = String(formData.get("source") ?? "new");
  if (!SOURCES.includes(source as (typeof SOURCES)[number])) throw new Error("Opción no válida");
  const url = String(formData.get("existing_url") ?? "").trim().slice(0, 300) || null;

  const { error } = await supabase
    .from("websites")
    .upsert({ business_id: business.id, source, existing_url: source === "new" ? null : url });
  if (error) throw new Error(error.message);

  if (business.onboarding_step === "brand") {
    await supabase.from("businesses").update({ onboarding_step: "website" }).eq("id", business.id);
  }
  await supabase.from("audit_log").insert({
    business_id: business.id,
    actor: "owner",
    actor_user_id: user.id,
    action: "brand.website_choice",
    data: { source, url },
  });
  revalidatePath("/onboarding", "layout");
  redirect("/onboarding/web");
}
