import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Scaled } from "@/components/scaled";
import { SiteView } from "@/components/site-view";
import { SubmitButton } from "@/components/submit-button";
import { Button, ButtonLink, PageTitle } from "@/components/ui";
import { siteContentFor } from "@/lib/brand-store";
import { SITE_TEMPLATES, templateById } from "@/lib/site-templates";
import { requireBusiness } from "@/lib/business";
import { slugify } from "@/lib/site";
import { chooseTemplate, publishWebsite } from "./actions";
import { DevicePreview } from "./device-preview";

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
  const current = templateById(website?.template);
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

      <section className="flex flex-col gap-4" aria-labelledby="diseno-title">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="diseno-title" className="font-display text-2xl font-bold">
            Así se ve: {current.name}
          </h2>
          <p className="text-sm text-muted">Mírala en celular, tablet y computadora.</p>
        </div>
        <DevicePreview src={`/vista-previa?plantilla=${current.id}&v=${encodeURIComponent(business.updated_at)}`} />
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="plantillas-title">
        <div className="flex flex-col gap-1">
          <h2 id="plantillas-title" className="font-display text-2xl font-bold">
            Elige el diseño de tu página
          </h2>
          <p className="text-muted">
            {SITE_TEMPLATES.length} diseños listos, todos se adaptan a celular, tablet y computadora y usan tus colores, tus letras y tu logo.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SITE_TEMPLATES.map((t) => {
            const selected = t.id === current.id;
            return (
              <li key={t.id} className={`flex flex-col gap-3 rounded-2xl border bg-panel p-3 ${selected ? "border-lime" : "border-line"}`}>
                <Scaled width={1280} height={820} className="rounded-xl">
                  <SiteView site={preview} template={t.id} preview />
                </Scaled>
                <div className="flex flex-col gap-0.5 px-1">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-sm text-muted">{t.description}</span>
                  <span className="text-xs text-muted">Ideal para: {t.goodFor}</span>
                </div>
                <form action={chooseTemplate.bind(null, t.id)} className="px-1 pb-1">
                  {selected ? (
                    <Button type="button" variant="ghost" disabled className="w-full">
                      ✓ Elegido
                    </Button>
                  ) : (
                    <SubmitButton variant="ghost" pendingText="Aplicando…" className="w-full">
                      Usar este diseño
                    </SubmitButton>
                  )}
                </form>
              </li>
            );
          })}
        </ul>
      </section>

      {published && (
        <ButtonLink href="/onboarding/crm" className="self-start">
          Seguir: CRM a tu medida →
        </ButtonLink>
      )}
    </>
  );
}
