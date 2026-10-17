import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicSite, loadSite } from "../public-site";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const s = await loadSite(slug);
  return s ? { title: `Blog · ${s.site.name}` } : { title: "Página no encontrada" };
}

// Lista de artículos del blog del negocio.
export default async function BlogPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const s = await loadSite(slug);
  if (!s) notFound();
  const supabase = await createClient();
  const { data: posts } = await supabase.from("blog_posts").select("slug, title, excerpt, created_at").eq("business_id", s.businessId).eq("published", true).order("created_at", { ascending: false }).limit(50);
  const day = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" });
  return (
    <PublicSite
      slug={slug}
      site={s.site}
      pages={s.pages}
      main={
        <div className="flex flex-col gap-10 py-6">
          <h1 className="text-4xl font-semibold tracking-tight [font-family:var(--heading)] sm:text-5xl">Blog</h1>
          {!posts?.length && <p className="text-[var(--muted)]">Pronto publicaremos artículos aquí.</p>}
          <ul className="grid gap-4 md:grid-cols-2">
            {(posts ?? []).map((p) => (
              <li key={p.slug}>
                <a href={`${s.pages.home}/blog/${p.slug}`} className="flex h-full flex-col gap-3 rounded-[var(--rl)] bg-[var(--surface)] p-6 transition hover:opacity-90">
                  <span className="text-sm text-[var(--muted)]">{day.format(new Date(p.created_at))}</span>
                  <span className="text-2xl font-semibold tracking-tight [font-family:var(--heading)]">{p.title}</span>
                  {p.excerpt && <span className="text-[var(--muted)]">{p.excerpt}</span>}
                  <span className="mt-auto font-semibold text-[var(--eyebrow)]">Leer →</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  );
}
