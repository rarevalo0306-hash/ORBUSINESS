import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicSite, loadSite } from "../../public-site";

type Props = { params: Promise<{ slug: string; post: string }> };

async function load(slug: string, post: string) {
  const s = await loadSite(slug);
  if (!s) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("blog_posts").select("title, excerpt, body, created_at").eq("business_id", s.businessId).eq("slug", post).eq("published", true).maybeSingle();
  return data ? { ...s, post: data } : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, post } = await props.params;
  const r = await load(slug, post);
  return r ? { title: `${r.post.title} · ${r.site.name}`, description: r.post.excerpt ?? undefined } : { title: "Página no encontrada" };
}

// Un artículo del blog. El texto se muestra tal cual (párrafos), sin HTML.
export default async function PostPage(props: Props) {
  const { slug, post } = await props.params;
  const r = await load(slug, post);
  if (!r) notFound();
  return (
    <PublicSite
      slug={slug}
      site={r.site}
      pages={r.pages}
      main={
        <article className="mx-auto flex max-w-3xl flex-col gap-6 py-6">
          <a href={`${r.pages.home}/blog`} className="text-sm text-[var(--muted)] underline underline-offset-4">
            ← Blog
          </a>
          <h1 className="text-4xl font-semibold tracking-tight [font-family:var(--heading)] sm:text-5xl">{r.post.title}</h1>
          <span className="text-sm text-[var(--muted)]">{new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric" }).format(new Date(r.post.created_at))}</span>
          {r.post.body
            .split(/\n\s*\n/)
            .map((para) => para.trim())
            .filter(Boolean)
            .map((para, i) => (
              <p key={i} className="text-lg leading-relaxed">
                {para}
              </p>
            ))}
        </article>
      }
    />
  );
}
