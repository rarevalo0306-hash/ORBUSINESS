import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteView } from "@/components/site-view";
import { Button, ButtonLink, PageTitle } from "@/components/ui";
import { siteContentFor } from "@/lib/brand-store";
import { requireBusiness } from "@/lib/business";
import { slugify } from "@/lib/site";
import { publishWebsite } from "./actions";

export default async function WebsitePage(props: PageProps<"/onboarding/web">) {
  const { supabase, business } = await requireBusiness();
  if (["interview", "brand"].includes(business.onboarding_step)) redirect("/onboarding/marca");
  const query = await props.searchParams;
  const host = (await headers()).get("host") ?? "";

  const [preview, { data: website }] = await Promise.all([
    siteContentFor(supabase, business),
    supabase.from("websites").select("*").eq("business_id", business.id).maybeSingle(),
  ]);
  const published = website?.status === "published" && website.subdomain;
  const path = `/sitio/${website?.subdomain ?? slugify(business.name)}`;

  return (
    <>
      <PageTitle
        title="Tu página web"
        lead={
          website?.source === "keep_existing"
            ? "Conservas tu página actual. Esta es la página de respaldo en Orbusiness, con el formulario conectado a tu CRM. En la siguiente fase te damos el código para agregar el chat de Nuna a tu página."
            : "Nuna la diseñó con lo que le contaste. Revísala y publícala: queda en línea al momento."
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-panel p-4">
        <span className="flex-1">
          Dirección: <strong>{host}{path}</strong>
          <span className="block text-sm text-muted">
            Dirección temporal de Orbusiness. Tu dominio propio (por ejemplo, {slugify(business.name).replace(/-/g, "")}.com) llega en la fase 3.
          </span>
        </span>
        {published ? (
          <>
            <span className="font-semibold text-lime">✓ En línea</span>
            <Link href={path} target="_blank" className="min-h-11 content-center underline underline-offset-4">
              Abrir mi página
            </Link>
          </>
        ) : null}
        <form action={publishWebsite}>
          <Button type="submit" variant={published ? "ghost" : "primary"}>
            {published ? "Volver a publicar con cambios" : "Publicar mi página"}
          </Button>
        </form>
      </div>
      {query.publicada && <p role="status" className="text-lime">Tu página quedó publicada.</p>}

      <div className="overflow-hidden rounded-2xl border border-line">
        <div className="bg-panel-2 px-4 py-2 text-sm text-muted">Vista previa</div>
        <SiteView site={preview} />
      </div>

      {published && (
        <ButtonLink href="/onboarding/crm" className="self-start">
          Seguir: CRM a tu medida →
        </ButtonLink>
      )}
    </>
  );
}
