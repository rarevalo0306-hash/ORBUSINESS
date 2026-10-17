import Link from "next/link";
import type { ReactNode } from "react";
import { SiteView, type SitePages } from "@/components/site-view";
import type { SiteContent } from "@/lib/site";
import { siteKind } from "@/lib/site-kinds";
import { createClient } from "@/lib/supabase/server";
import { LeadForm } from "./lead-form";
import { AddToOrder, OrderBar } from "./order";

// Lo común de todas las páginas públicas de un negocio: carga, menú de páginas, formulario, carrito y citas.

export async function loadSite(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("websites").select("business_id, content").eq("subdomain", slug).eq("status", "published").maybeSingle();
  if (!data) return null;
  const { count } = await supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("business_id", data.business_id).eq("published", true);
  const site = data.content as unknown as SiteContent;
  const pages: SitePages = { home: `/sitio/${slug}`, catalog: siteKind(site.industry, site.kind), hasBlog: (count ?? 0) > 0 };
  return { site, pages, businessId: data.business_id };
}

export function PublicSite(props: { slug: string; site: SiteContent; pages: SitePages; page?: "inicio" | "catalogo" | "nosotros" | "contacto"; main?: ReactNode }) {
  const { slug, site } = props;
  return (
    <SiteView
      site={site}
      pages={props.pages}
      home={props.pages.home}
      page={props.page ?? "inicio"}
      main={props.main}
      leadForm={<LeadForm slug={slug} cta={site.copy?.cta ?? site.ctaLabel} copy={site.copy} />}
      orderButton={(s) =>
        s.kind === "service" && site.booking?.enabled ? (
          <Link
            href={`/sitio/${slug}/agendar?servicio=${s.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--rb)] border border-current px-4 text-sm font-semibold transition active:scale-[0.98]"
          >
            Agendar cita
          </Link>
        ) : (
          <AddToOrder item={s} slug={slug} />
        )
      }
      cart={props.main ? undefined : <OrderBar slug={slug} currency={site.currency} />}
    />
  );
}
