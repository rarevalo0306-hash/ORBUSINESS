import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { storedKit } from "@/lib/brand";
import { kitLogoUrl } from "@/lib/brand-store";
import { requireBusiness } from "@/lib/business";
import { BrandManual } from "./manual-view";

export const metadata: Metadata = { title: "Manual de marca" };

export default async function BrandManualPage() {
  const { supabase, business: b } = await requireBusiness();
  const kit = storedKit(b.brand_kit, b);
  if (!kit || b.brand_status !== "purchased") redirect("/onboarding/marca#kit");
  const { data: website } = await supabase.from("websites").select("subdomain, status").eq("business_id", b.id).maybeSingle();
  const host = (await headers()).get("host") ?? "orbusiness.app";
  const siteUrl = website?.status === "published" && website.subdomain ? `https://${host}/sitio/${website.subdomain}` : null;
  return <BrandManual b={b} kit={kit} siteUrl={siteUrl} logoPngUrl={kitLogoUrl(b)} />;
}

