import { SubmitButton } from "@/components/submit-button";
import { requireBusiness } from "@/lib/business";
import { deletePost, savePost, writePost } from "./actions";

const field = "rounded-[14px] border border-line bg-ink px-3 py-2 text-bone";

// Blog de la página: Nuna escribe, el dueño revisa.
export default async function BlogAdminPage() {
  const { supabase, business } = await requireBusiness();
  const [{ data: posts }, { data: site }] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("websites").select("subdomain, status").eq("business_id", business.id).maybeSingle(),
  ]);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Blog</h1>
        <p className="max-w-2xl text-muted">
          Artículos útiles para tus clientes. Ayudan a que te encuentren en Google. Nuna los escribe con lo que sabe de tu negocio; revísalos antes de dejarlos visibles.
          {site?.status === "published" && site.subdomain && (
            <>
              {" "}
              <a href={`/sitio/${site.subdomain}/blog`} target="_blank" className="font-semibold text-lime underline-offset-4 hover:underline">
                Ver mi blog →
              </a>
            </>
          )}
        </p>
      </div>

      <form action={writePost} className="flex flex-col gap-2 rounded-[24px] border border-white/[0.06] bg-panel p-5 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-semibold text-muted">
          ¿Sobre qué quieres el artículo? (opcional)
          <input name="topic" maxLength={200} placeholder="Ej.: cómo cuidar tu jardín en temporada de lluvias" className={`${field} min-h-12`} />
        </label>
        <SubmitButton pendingText="Nuna está escribiendo… (unos 20 segundos)">Escribir artículo con Nuna</SubmitButton>
      </form>

      {!posts?.length && <p className="rounded-[24px] border border-dashed border-line p-8 text-center text-muted">Todavía no hay artículos. Pídele a Nuna el primero.</p>}

      <ul className="flex flex-col gap-4">
        {(posts ?? []).map((p) => (
          <li key={p.id} className="rounded-[24px] border border-white/[0.06] bg-panel p-5">
            <details>
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                <span className="text-lg font-semibold">{p.title}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${p.published ? "bg-lime text-lime-ink" : "bg-panel-2 text-muted"}`}>{p.published ? "Visible" : "Oculto"}</span>
              </summary>
              <form action={savePost.bind(null, p.id)} className="mt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm text-muted">
                  Título
                  <input name="title" defaultValue={p.title} maxLength={140} required className={`${field} min-h-11`} />
                </label>
                <label className="flex flex-col gap-1 text-sm text-muted">
                  Resumen
                  <input name="excerpt" defaultValue={p.excerpt ?? ""} maxLength={300} className={`${field} min-h-11`} />
                </label>
                <label className="flex flex-col gap-1 text-sm text-muted">
                  Artículo (deja una línea en blanco entre párrafos)
                  <textarea name="body" defaultValue={p.body} rows={12} maxLength={12000} required className={`${field} leading-relaxed`} />
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="published" defaultChecked={p.published} className="size-5 accent-[var(--color-lime)]" />
                  Visible en mi página
                </label>
                <div className="flex flex-wrap gap-3">
                  <SubmitButton pendingText="Guardando…">Guardar</SubmitButton>
                </div>
              </form>
              <form action={deletePost.bind(null, p.id)} className="mt-3">
                <button className="min-h-11 text-sm text-muted underline underline-offset-4 hover:text-bone">Borrar artículo</button>
              </form>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
