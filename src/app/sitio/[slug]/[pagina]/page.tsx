import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { legalDoc, legalPages, type LegalPage } from "@/lib/site-legal";
import { PublicSite, loadSite } from "../public-site";

// Páginas internas: catálogo (tienda, menú, servicios o portafolio), nosotros, contacto y legales.

type Props = { params: Promise<{ slug: string; pagina: string }> };

async function resolve(slug: string, pagina: string) {
  const s = await loadSite(slug);
  if (!s) return null;
  if (pagina === s.pages.catalog.path) return { ...s, page: "catalogo" as const, title: s.pages.catalog.title };
  if (pagina === "nosotros") return { ...s, page: "nosotros" as const, title: "Nosotros" };
  if (pagina === "contacto") return { ...s, page: "contacto" as const, title: "Contacto" };
  const legal = legalPages(s.site).find((l) => l.path === pagina);
  if (legal) return { ...s, legal: legal.path as LegalPage, title: legal.label };
  return null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, pagina } = await props.params;
  const r = await resolve(slug, pagina);
  return r ? { title: `${r.title} · ${r.site.name}`, description: r.site.tagline } : { title: "Página no encontrada" };
}

export default async function SitePage(props: Props) {
  const { slug, pagina } = await props.params;
  const r = await resolve(slug, pagina);
  if (!r) notFound();
  if ("legal" in r && r.legal) {
    const doc = legalDoc(r.site, r.legal);
    return (
      <PublicSite
        slug={slug}
        site={r.site}
        pages={r.pages}
        main={
          <article className="mx-auto flex max-w-3xl flex-col gap-8 py-6">
            <h1 className="text-4xl font-semibold tracking-tight [font-family:var(--heading)]">{doc.title}</h1>
            {doc.sections.map((sec) => (
              <section key={sec.title} className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold [font-family:var(--heading)]">{sec.title}</h2>
                {sec.text.map((t) => (
                  <p key={t} className="leading-relaxed text-[var(--muted)]">
                    {t}
                  </p>
                ))}
              </section>
            ))}
            <p className="text-sm text-[var(--muted)]">Última actualización: {new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(new Date())}.</p>
          </article>
        }
      />
    );
  }
  return <PublicSite slug={slug} site={r.site} pages={r.pages} page={"page" in r ? r.page : "inicio"} />;
}
