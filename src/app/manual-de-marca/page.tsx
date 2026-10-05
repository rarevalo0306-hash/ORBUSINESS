import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { rulesBase, storedKit } from "@/lib/brand";
import { kitLogoUrl, siteUrlFor } from "@/lib/brand-store";
import { requireBusiness } from "@/lib/business";
import { BrandManual } from "./manual-view";

export const metadata: Metadata = { title: "Manual de marca" };

export default async function BrandManualPage() {
  const { supabase, business: b } = await requireBusiness();
  const kit = storedKit(b.brand_kit, b);
  if (!kit || b.brand_status !== "purchased") redirect("/onboarding/marca#kit");
  const siteUrl = await siteUrlFor(supabase, b, (await headers()).get("host") ?? "orbusiness.app");
  // La versión (fecha de cambio) evita que el navegador muestre imágenes viejas después de ajustar la marca.
  const v = encodeURIComponent(b.updated_at);
  return (
    <BrandManual
      name={b.name}
      owner={b.owner_name}
      phone={b.phone}
      address={b.address}
      kit={kit}
      base={kit.base ?? rulesBase(b, kit)}
      siteUrl={siteUrl}
      logoPngUrl={kitLogoUrl(b)}
      img={(id) => `/api/marca/${id}?ver=${v}`}
    />
  );
}
