"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeKit, storedKit, storedOptions, type BrandKit } from "@/lib/brand";
import { proposeKits, writeBase } from "@/lib/brand-ai";
import { brandKitPrice, saveKit } from "@/lib/brand-store";
import { requireBusiness } from "@/lib/business";
import type { Json } from "@/lib/database.types";

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

// ---------- Kit de marca ----------

// Nuna propone 3 identidades de marca (gratis, para que el dueño las vea).
export async function generateKits() {
  const { supabase, user, business } = await requireBusiness();
  const { data: services } = await supabase.from("services").select("name").eq("business_id", business.id).order("sort");
  const kits = await proposeKits(business, services ?? []);
  const { error } = await supabase
    .from("businesses")
    .update({ brand_options: kits as unknown as Json })
    .eq("id", business.id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_log").insert({
    business_id: business.id,
    actor: "nuna",
    actor_user_id: user.id,
    action: "brand.kits_proposed",
    data: { kits: kits.map((k) => k.name) },
  });
  revalidatePath("/onboarding/marca");
}

// El dueño elige una propuesta: Nuna le escribe la base de marca completa (historia, misión,
// valores, voz y textos listos para usar).
export async function chooseKit(index: number) {
  const { supabase, user, business } = await requireBusiness();
  const option = storedOptions(business.brand_options, business)[index];
  if (!option) throw new Error("Propuesta no encontrada");
  const { data: services } = await supabase.from("services").select("name").eq("business_id", business.id).order("sort");
  const kit = { ...option, base: await writeBase(business, services ?? [], option) };
  await saveKit(supabase, business, kit, business.brand_status === "purchased" ? {} : { brand_status: "chosen" });
  await supabase.from("audit_log").insert({
    business_id: business.id,
    actor: "owner",
    actor_user_id: user.id,
    action: "brand.kit_chosen",
    data: { name: kit.name },
  });
  revalidatePath("/onboarding/marca");
}

// Volver a escribir la base de marca (por ejemplo, después de cambiar el eslogan).
export async function rewriteBase() {
  const { supabase, business } = await requireBusiness();
  const current = storedKit(business.brand_kit, business);
  if (!current) throw new Error("Primero elige una propuesta");
  const { data: services } = await supabase.from("services").select("name").eq("business_id", business.id).order("sort");
  await saveKit(supabase, business, { ...current, base: await writeBase(business, services ?? [], current) });
  revalidatePath("/onboarding/marca");
  revalidatePath("/manual-de-marca");
}

// Ajustes del dueño (colores, letra, símbolo, forma, eslogan). Solo valores de las colecciones curadas.
export async function customizeKit(changes: Partial<BrandKit>) {
  const { supabase, business } = await requireBusiness();
  const current = storedKit(business.brand_kit, business);
  if (!current) throw new Error("Primero elige una propuesta");
  await saveKit(supabase, business, sanitizeKit({ ...current, ...changes }, current));
  revalidatePath("/onboarding/marca");
  revalidatePath("/manual-de-marca");
}

// Compra del kit completo. MODO PRUEBA: no se cobra nada hasta conectar Stripe (fase 3).
export async function purchaseKit() {
  const { supabase, user, business } = await requireBusiness();
  const kit = storedKit(business.brand_kit, business);
  if (!kit) throw new Error("Primero elige una propuesta");
  if (business.brand_status !== "purchased") {
    const { error } = await supabase.rpc("purchase_brand_kit_test", { p_business: business.id });
    if (error) throw new Error(error.message);
    const { data: updated } = await supabase.from("businesses").select("*").eq("id", business.id).single();
    // Con la compra: logo PNG público (firma de email) y la marca aplicada a la página publicada.
    if (updated) await saveKit(supabase, updated, kit);
    await supabase.from("audit_log").insert({
      business_id: business.id,
      actor: "owner",
      actor_user_id: user.id,
      action: "brand.kit_purchased",
      data: { price: brandKitPrice(), test_mode: true, kit: kit.name },
    });
  }
  revalidatePath("/onboarding", "layout");
  redirect("/onboarding/marca?comprado=1#kit");
}
