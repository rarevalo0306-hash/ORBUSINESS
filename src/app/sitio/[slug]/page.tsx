import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicSite, loadSite } from "./public-site";

export async function generateMetadata(props: PageProps<"/sitio/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const s = await loadSite(slug);
  return s ? { title: s.site.name, description: s.site.tagline } : { title: "Página no encontrada" };
}

export default async function PublicSitePage(props: PageProps<"/sitio/[slug]">) {
  const { slug } = await props.params;
  const s = await loadSite(slug);
  if (!s) notFound();
  return <PublicSite slug={slug} site={s.site} pages={s.pages} />;
}
