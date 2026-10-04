"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { publicAssetUrl, requireBusiness } from "@/lib/business";
import { buildSiteContent, slugify } from "@/lib/site";

export async function publishWebsite() {
  const { supabase, user, business } = await requireBusiness();

  const [{ data: services }, { data: assets }, { data: website }] = await Promise.all([
    supabase.from("services").select("*").eq("business_id", business.id).order("sort"),
    supabase.from("brand_assets").select("kind, storage_path").eq("business_id", business.id).order("created_at"),
    supabase.from("websites").select("subdomain").eq("business_id", business.id).maybeSingle(),
  ]);
  const logo = assets?.find((a) => a.kind === "logo");
  const photos = (assets ?? []).filter((a) => a.kind === "photo").map((a) => publicAssetUrl(a.storage_path));
  const content = buildSiteContent(business, services ?? [], logo ? publicAssetUrl(logo.storage_path) : null, photos);

  // Dirección temporal: orbusiness.site/sitio/<nombre>. Si ya existe, se le agrega un número.
  const base = website?.subdomain ?? slugify(business.name);
  let subdomain = base;
  for (let attempt = 1; attempt <= 20; attempt++) {
    const { error } = await supabase.from("websites").upsert({
      business_id: business.id,
      subdomain,
      content,
      status: "published",
      published_at: new Date().toISOString(),
    });
    if (!error) break;
    if (error.code !== "23505") throw new Error(error.message); // 23505 = dirección ocupada
    subdomain = `${base}-${attempt + 1}`;
  }

  await supabase
    .from("businesses")
    .update({ slug: subdomain, ...(business.onboarding_step === "website" ? { onboarding_step: "crm" } : {}) })
    .eq("id", business.id);
  await supabase.from("audit_log").insert({
    business_id: business.id,
    actor: "owner",
    actor_user_id: user.id,
    action: "website.published",
    data: { subdomain },
  });
  revalidatePath("/onboarding", "layout");
  revalidatePath(`/sitio/${subdomain}`);
  redirect("/onboarding/web?publicada=1");
}
