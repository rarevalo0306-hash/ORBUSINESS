import type { Metadata } from "next";
import { SiteView } from "@/components/site-view";
import { siteContentFor } from "@/lib/brand-store";
import { requireBusiness } from "@/lib/business";

export const metadata: Metadata = { title: "Vista previa" };

// Vista previa de la página del negocio con cualquier plantilla (se muestra dentro de un iframe
// del tamaño de un celular, tablet o computadora, para ver el diseño adaptable de verdad).
export default async function PreviewPage(props: PageProps<"/vista-previa">) {
  const { supabase, business } = await requireBusiness();
  const { plantilla } = await props.searchParams;
  const site = await siteContentFor(supabase, business);
  return <SiteView site={site} template={typeof plantilla === "string" ? plantilla : undefined} />;
}
