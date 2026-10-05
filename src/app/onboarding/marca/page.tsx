import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { SubmitButton } from "@/components/submit-button";
import { Button, PageTitle } from "@/components/ui";
import {
  FONT_PAIRS,
  fontsById,
  googleFontsHref,
  gradientCss,
  iconsFor,
  paletteById,
  palettesFor,
  storedKit,
  storedOptions,
  type BrandKit,
} from "@/lib/brand";
import { brandKitPrice } from "@/lib/brand-store";
import { publicAssetUrl, requireBusiness } from "@/lib/business";
import { chooseKit, generateKits, purchaseKit, saveBrand } from "./actions";
import { KitEditor } from "./kit-editor";
import { Uploader } from "./uploader";

const OPTIONS = [
  { value: "new", label: "No tengo página / hazme una nueva", note: "Nuna diseña una página nueva para tu negocio." },
  {
    value: "keep_existing",
    label: "Sí tengo, quiero usar la mía",
    note: "Conservas tu página y le agregamos el chat de Nuna y el formulario de cotización.",
  },
  {
    value: "rebuild",
    label: "Sí tengo, pero quiero una nueva",
    note: "Nuna toma ideas de tu página actual y diseña una nueva.",
  },
];

const INCLUDES = [
  "Logo en todas sus versiones (a color, en blanco, a un color e isotipo), en SVG y PNG",
  "Manual de marca: cómo usar tu logo, colores con sus códigos, degradado y tipografías",
  "Imágenes para redes: foto de perfil, portada y primera publicación",
  "Tarjeta de presentación lista para imprimir y firma para tu email",
  "Tu página web con tus colores, tus letras y tu logo",
];

const DOWNLOADS = [
  { file: "logo-horizontal.svg", label: "Logo horizontal (SVG)" },
  { file: "logo-horizontal.png", label: "Logo horizontal (PNG)" },
  { file: "logo-vertical.svg", label: "Logo vertical (SVG)" },
  { file: "logo-blanco.svg", label: "Logo en blanco, para fondos oscuros (SVG)" },
  { file: "logo-un-color.svg", label: "Logo a un color (SVG)" },
  { file: "isotipo.svg", label: "Isotipo (SVG)" },
  { file: "isotipo.png", label: "Isotipo (PNG)" },
  { file: "perfil.png", label: "Foto de perfil para redes" },
  { file: "portada.png", label: "Portada para Facebook" },
  { file: "publicacion.png", label: "Publicación de presentación" },
];

function Proposal({ kit, name, index, selected }: { kit: BrandKit; name: string; index: number; selected: boolean }) {
  const p = paletteById(kit.palette);
  const f = fontsById(kit.fonts);
  return (
    <article className={`flex flex-col gap-4 rounded-2xl border bg-panel p-5 ${selected ? "border-lime" : "border-line"}`}>
      <div className="flex min-h-28 items-center justify-center rounded-xl p-4" style={{ background: p.light }}>
        <BrandLogo kit={kit} name={name} size={40} className="max-w-full flex-wrap justify-center" />
      </div>
      <div className="h-3 rounded-full" style={{ background: gradientCss(p) }} aria-hidden />
      <div className="flex gap-1.5" aria-label={`Colores: ${p.name}`}>
        {[p.primary, p.secondary, p.accent, p.dark, p.light].map((c) => (
          <span key={c} className="h-6 flex-1 rounded-md border border-line" style={{ background: c }} />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-xl font-bold">{kit.name}</h3>
        <p className="text-sm text-muted">{kit.concept}</p>
      </div>
      <p className="text-lg" style={{ fontFamily: `"${f.heading.family}"`, fontWeight: f.heading.weight }}>
        “{kit.slogan}”
      </p>
      <p className="text-sm text-muted">
        Letra {f.name.toLowerCase()} · {kit.personality.join(" · ")}
      </p>
      <form action={chooseKit.bind(null, index)} className="mt-auto">
        {selected ? (
          <Button type="button" variant="ghost" disabled className="w-full">
            ✓ Elegida
          </Button>
        ) : (
          <SubmitButton pendingText="Eligiendo…" className="w-full">
            Elegir esta
          </SubmitButton>
        )}
      </form>
    </article>
  );
}

export default async function BrandPage(props: PageProps<"/onboarding/marca">) {
  const { supabase, business } = await requireBusiness();
  if (business.onboarding_step === "interview") redirect("/onboarding/entrevista");
  const query = await props.searchParams;

  const [{ data: assets }, { data: website }] = await Promise.all([
    supabase.from("brand_assets").select("id, kind, storage_path").eq("business_id", business.id).order("created_at"),
    supabase.from("websites").select("source, existing_url").eq("business_id", business.id).maybeSingle(),
  ]);
  const withUrls = (assets ?? []).map((a) => ({ id: a.id, kind: a.kind, url: publicAssetUrl(a.storage_path) }));
  const source = website?.source ?? "new";

  const options = storedOptions(business.brand_options, business);
  const kit = storedKit(business.brand_kit, business);
  const purchased = business.brand_status === "purchased";
  const price = brandKitPrice();

  return (
    <>
      <link rel="stylesheet" href={googleFontsHref(FONT_PAIRS)} precedence="default" />
      <PageTitle
        title="Tu marca, tus fotos y tu página actual"
        lead="Nuna te propone una identidad de marca completa para tu negocio: logo, colores, tipo de letra y eslogan. Ver las propuestas es gratis."
      />

      <section id="kit" className="flex scroll-mt-4 flex-col gap-5" aria-labelledby="kit-title">
        <h2 id="kit-title" className="font-display text-2xl font-bold">
          Identidad de marca
        </h2>
        {query.comprado && purchased && (
          <p role="status" className="rounded-2xl border border-lime/40 bg-lime/10 p-4 text-lime">
            ¡Listo! Tu kit de marca es tuyo. Ya puedes descargarlo y ya quedó aplicado a tu página web.
          </p>
        )}

        {options.length === 0 ? (
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-5">
            <p className="max-w-2xl text-muted">
              Con lo que le contaste en la entrevista, Nuna diseña 3 propuestas distintas para {business.name}. Tú eliges
              la que más te guste y la ajustas a tu gusto.
            </p>
            <form action={generateKits}>
              <SubmitButton pendingText="Nuna está diseñando tus propuestas… (unos segundos)">
                Ver mis 3 propuestas de marca
              </SubmitButton>
            </form>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              {options.map((o, i) => (
                <Proposal key={i} kit={o} name={business.name} index={i} selected={kit?.name === o.name} />
              ))}
            </div>
            <form action={generateKits}>
              <SubmitButton variant="ghost" pendingText="Nuna está diseñando otras propuestas…">
                Ver otras 3 propuestas
              </SubmitButton>
            </form>
          </>
        )}

        {kit && (
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-5">
            <h3 className="font-display text-xl font-bold">Ajusta tu marca</h3>
            <KitEditor
              key={kit.name}
              kit={kit}
              name={business.name}
              palettes={palettesFor(business.industry)}
              icons={iconsFor(business.industry)}
            />
          </div>
        )}

        {kit && !purchased && (
          <div className="flex flex-col gap-4 rounded-2xl border border-lime/50 bg-panel p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-xl font-bold">Kit de marca completo</h3>
              <span className="font-display text-2xl font-bold text-lime">
                {price} <span className="text-sm font-normal text-muted">pago único</span>
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {INCLUDES.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden className="text-lime">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <form action={purchaseKit} className="flex flex-col gap-2">
              <SubmitButton pendingText="Preparando tu kit…" className="self-start">
                Comprar mi kit de marca · {price}
              </SubmitButton>
              <p className="text-sm text-muted">
                Modo prueba: no se cobra nada todavía. El cobro real se activa cuando conectemos los pagos.
              </p>
            </form>
          </div>
        )}

        {kit && purchased && (
          <div className="flex flex-col gap-4 rounded-2xl border border-line bg-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-xl font-bold">Tu kit de marca ✓</h3>
              <Link
                href="/manual-de-marca"
                target="_blank"
                className="inline-flex min-h-12 items-center rounded-full bg-lime px-6 font-semibold text-lime-ink"
              >
                Abrir manual de marca
              </Link>
            </div>
            <p className="text-sm text-muted">
              Si cambias algo arriba, tus descargas, tu manual y tu página web se actualizan solos.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {DOWNLOADS.map((d) => (
                <li key={d.file}>
                  <a
                    href={`/api/marca/${d.file}`}
                    download={d.file}
                    className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-line px-4 py-2 hover:bg-panel-2"
                  >
                    {d.label}
                    <span aria-hidden className="text-muted">
                      ↓
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="assets-title">
        <h2 id="assets-title" className="font-display text-2xl font-bold">
          ¿Ya tienes logo o fotos?
        </h2>
        <p className="max-w-2xl text-muted">Todo es opcional. Si subes tu propio logo, tu página lo usa en lugar del de Nuna.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Uploader
            businessId={business.id}
            kind="logo"
            label="Logo"
            emptyNote={kit ? "Sin logo propio: tu página usa el logo de tu kit de marca." : "Sin logo: Nuna usa las iniciales del negocio."}
            multiple={false}
            assets={withUrls.filter((a) => a.kind === "logo")}
          />
          <Uploader
            businessId={business.id}
            kind="photo"
            label="Fotos de tus trabajos o productos"
            emptyNote="Sin fotos: la página muestra espacios para agregarlas después."
            multiple
            assets={withUrls.filter((a) => a.kind === "photo")}
          />
        </div>
      </section>

      <form action={saveBrand} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
          <legend className="px-1 font-semibold">¿Ya tienes página web?</legend>
          {OPTIONS.map((o) => (
            <label key={o.value} className="flex min-h-11 cursor-pointer items-start gap-3">
              <input type="radio" name="source" value={o.value} defaultChecked={source === o.value} className="mt-1.5 size-4 accent-lime" />
              <span className="flex flex-col">
                <span className="font-semibold">{o.label}</span>
                <span className="text-sm text-muted">{o.note}</span>
              </span>
            </label>
          ))}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="existing_url" className="text-sm font-semibold text-muted">
              Si tienes página, ¿cuál es la dirección?
            </label>
            <input
              id="existing_url"
              name="existing_url"
              defaultValue={website?.existing_url ?? ""}
              placeholder="www.minegocio.com"
              className="min-h-12 rounded-xl border border-line bg-ink px-4 placeholder:text-muted/70"
            />
          </div>
        </fieldset>
        <Button type="submit" className="self-start">
          Listo → diseñar mi página
        </Button>
      </form>
    </>
  );
}
