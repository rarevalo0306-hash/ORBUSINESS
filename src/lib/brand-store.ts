import "server-only";
import { revalidatePath } from "next/cache";
import { storedKit, type BrandKit } from "@/lib/brand";
import { logoPng } from "@/lib/brand-render";
import { publicAssetUrl } from "@/lib/business";
import type { Json, Tables } from "@/lib/database.types";
import { buildSiteContent } from "@/lib/site";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type Business = Tables<"businesses">;

// Precio del kit de marca completo (se cambia en Vercel sin tocar el código).
export const brandKitPrice = () => process.env.BRAND_KIT_PRICE?.trim() || "US$49";

// Logo PNG público (para la firma de email, que necesita una imagen en internet).
// Se guarda en brand_kit.logoPng junto al kit.
export const kitLogoUrl = (b: Business) => {
  const path = (b.brand_kit as { logoPng?: unknown } | null)?.logoPng;
  return typeof path === "string" && path.startsWith(`${b.id}/`) ? publicAssetUrl(path) : null;
};

// Guarda el kit elegido. Si ya está comprado, regenera el logo PNG público y actualiza la página publicada.
export async function saveKit(supabase: Supabase, b: Business, kit: BrandKit, patch: { brand_status?: string } = {}) {
  const purchased = (patch.brand_status ?? b.brand_status) === "purchased";
  const oldPath = (b.brand_kit as { logoPng?: unknown } | null)?.logoPng;
  let logoPath: string | null = null;
  if (purchased) {
    const png = await (await logoPng(kit, b.name, "horizontal", 640)).arrayBuffer();
    logoPath = `${b.id}/marca-logo-${Date.now()}.png`;
    const { error } = await supabase.storage.from("brand-assets").upload(logoPath, png, { contentType: "image/png" });
    if (error) logoPath = null;
  }
  const keepPath = logoPath ?? (typeof oldPath === "string" ? oldPath : null);
  const stored = { ...kit, ...(keepPath ? { logoPng: keepPath } : {}) } as unknown as Json;
  const { data: updated, error } = await supabase
    .from("businesses")
    .update({ ...patch, brand_kit: stored })
    .eq("id", b.id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  if (logoPath && typeof oldPath === "string" && oldPath.startsWith(`${b.id}/`)) {
    await supabase.storage.from("brand-assets").remove([oldPath]);
  }
  if (purchased) await refreshPublishedSite(supabase, updated);
  return updated;
}

// Contenido de la página web con lo que hay hoy (servicios, fotos, logo y, si se compró, la marca).
export async function siteContentFor(supabase: Supabase, b: Business) {
  const [{ data: services }, { data: assets }] = await Promise.all([
    supabase.from("services").select("*").eq("business_id", b.id).order("sort"),
    supabase.from("brand_assets").select("kind, storage_path").eq("business_id", b.id).order("created_at"),
  ]);
  const logo = assets?.find((a) => a.kind === "logo");
  const photos = (assets ?? []).filter((a) => a.kind === "photo").map((a) => publicAssetUrl(a.storage_path));
  const brand = b.brand_status === "purchased" ? storedKit(b.brand_kit, b) : null;
  return buildSiteContent(b, services ?? [], logo ? publicAssetUrl(logo.storage_path) : null, photos, brand);
}

// Si la página ya está publicada, le aplica los cambios al momento.
export async function refreshPublishedSite(supabase: Supabase, b: Business) {
  const { data: website } = await supabase
    .from("websites")
    .select("status, subdomain")
    .eq("business_id", b.id)
    .maybeSingle();
  if (website?.status !== "published" || !website.subdomain) return;
  const content = (await siteContentFor(supabase, b)) as unknown as Json;
  await supabase.from("websites").update({ content }).eq("business_id", b.id);
  revalidatePath(`/sitio/${website.subdomain}`);
}
