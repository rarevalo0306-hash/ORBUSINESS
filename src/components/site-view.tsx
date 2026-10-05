import type { CSSProperties, ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { contrast, fontsById, googleFontsHref, gradientCss, onColor, paletteById, sanitizeKit, type BrandKit } from "@/lib/brand";
import { currencyName, priceLabel } from "@/lib/interview";
import type { SiteContent } from "@/lib/site";

// La página web de un negocio. Usa la paleta del negocio (no la de Orbusiness): la de su kit de
// marca si lo compró, o una paleta clara neutra si no.
const BASE_THEME = {
  "--s-bg": "#f4f1ea",
  "--s-ink": "#1f2a1c",
  "--s-body": "#3d4a38",
  "--s-primary": "#1f2a1c",
  "--s-on-primary": "#f4f1ea",
  "--s-eyebrow": "#4a6b3e",
  "--s-line": "#d6dccd",
  "--s-soft": "#dfe6d6",
  "--s-footer": "#5d6b56",
  "--s-heading": "var(--font-display)",
  "--s-text": "var(--font-sans)",
  "--s-hero": "#dfe6d6",
};

function brandTheme(kit: BrandKit) {
  const p = paletteById(kit.palette);
  const f = fontsById(kit.fonts);
  return {
    "--s-bg": p.light,
    "--s-ink": p.dark,
    "--s-body": `color-mix(in srgb, ${p.dark} 82%, ${p.light})`,
    "--s-primary": p.primary,
    "--s-on-primary": onColor(p.primary, p.dark),
    "--s-eyebrow": contrast(p.primary, p.light) >= 4.5 ? p.primary : p.dark,
    "--s-line": `color-mix(in srgb, ${p.primary} 20%, ${p.light})`,
    "--s-soft": `color-mix(in srgb, ${p.primary} 12%, ${p.light})`,
    "--s-footer": `color-mix(in srgb, ${p.dark} 70%, ${p.light})`,
    "--s-heading": `"${f.heading.family}", system-ui, sans-serif`,
    "--s-text": `"${f.body.family}", system-ui, sans-serif`,
    "--s-hero": gradientCss(p),
  };
}

function whatsappLink(phone: string, name: string) {
  const text = encodeURIComponent(`Hola ${name}, quisiera información.`);
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${text}`;
}

export function SiteView({ site, leadForm }: { site: SiteContent; leadForm?: ReactNode }) {
  const cta = site.copy?.cta ?? site.ctaLabel;
  const wa = site.phone ? whatsappLink(site.phone, site.name) : null;
  const waLabel = site.copy?.whatsapp ?? "Escríbenos por WhatsApp";
  const waFirst = Boolean(wa && site.whatsappFirst !== false);
  const kit = site.brand ? sanitizeKit(site.brand, site.brand) : null;
  const theme = (kit ? brandTheme(kit) : BASE_THEME) as CSSProperties;
  const initials = site.name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div style={{ ...theme, fontFamily: "var(--s-text)" }} className="bg-[var(--s-bg)] text-[var(--s-ink)] [&_h1]:[font-family:var(--s-heading)] [&_h2]:[font-family:var(--s-heading)]">
      {kit && <link rel="stylesheet" href={googleFontsHref([fontsById(kit.fonts)])} precedence="default" />}
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
        <div className="flex items-center gap-3">
          {site.logoUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={site.logoUrl} alt={`Logo de ${site.name}`} className="size-12 rounded-lg object-contain" />
              <span className="text-xl font-bold [font-family:var(--s-heading)]">{site.name}</span>
            </>
          ) : kit ? (
            <BrandLogo kit={kit} name={site.name} size={44} />
          ) : (
            <>
              <span className="flex size-12 items-center justify-center rounded-lg bg-[var(--s-primary)] text-lg font-bold text-[var(--s-on-primary)] [font-family:var(--s-heading)]">
                {initials}
              </span>
              <span className="text-xl font-bold [font-family:var(--s-heading)]">{site.name}</span>
            </>
          )}
        </div>
        {waFirst ? (
          <a href={wa!} target="_blank" rel="noopener" className="hidden min-h-11 items-center rounded-full bg-[#1d7a45] px-5 font-semibold text-white sm:inline-flex">
            WhatsApp
          </a>
        ) : (
          <a href="#cotizacion" className="hidden min-h-11 items-center rounded-full bg-[var(--s-primary)] px-5 font-semibold text-[var(--s-on-primary)] sm:inline-flex">
            {cta}
          </a>
        )}
      </header>

      <section className="mx-auto grid max-w-5xl gap-8 px-5 py-10 md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--s-eyebrow)]">
            {site.industry}
            {site.zone ? ` · ${site.zone}` : ""}
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{site.tagline}</h1>
          <p className="text-lg text-[var(--s-body)]">{site.intro}</p>
          <div className="flex flex-wrap gap-3">
            {waFirst && (
              <a href={wa!} target="_blank" rel="noopener" className="inline-flex min-h-12 items-center rounded-full bg-[#1d7a45] px-6 font-semibold text-white">
                {waLabel}
              </a>
            )}
            <a
              href="#cotizacion"
              className={`inline-flex min-h-12 items-center rounded-full px-6 font-semibold ${waFirst ? "border border-[var(--s-ink)]" : "bg-[var(--s-primary)] text-[var(--s-on-primary)]"}`}
            >
              {cta}
            </a>
          </div>
        </div>
        {site.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={site.photos[0]} alt={`Trabajo de ${site.name}`} className="aspect-[4/3] w-full rounded-2xl object-cover" />
        ) : (
          <div
            style={{ background: "var(--s-hero)" }}
            className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 rounded-2xl p-6 text-center ${kit ? "text-[var(--s-on-primary)]" : "text-[var(--s-eyebrow)]"}`}
          >
            {kit ? (
              <>
                <BrandLogo kit={kit} name={site.name} layout="isotipo" theme="blanco" size={96} />
                <span className="text-2xl font-bold [font-family:var(--s-heading)]">{kit.slogan}</span>
              </>
            ) : (
              site.name
            )}
          </div>
        )}
      </section>

      {site.services.length > 0 && (
        <section className="mx-auto max-w-5xl px-5 py-10">
          <h2 className="mb-2 text-3xl font-bold">Lo que ofrecemos</h2>
          {site.secondaryCurrency && (
            <p className="mb-5 text-[var(--s-body)]">
              Precios en {currencyName(site.currency)}; también aceptamos {currencyName(site.secondaryCurrency)}.
            </p>
          )}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {site.services.map((s) => (
              <li key={s.name} className="flex flex-col gap-1 rounded-2xl border border-[var(--s-line)] bg-white p-5">
                <span className="text-lg font-semibold">{s.name}</span>
                <span className="text-[var(--s-eyebrow)]">{priceLabel(s.price, site.currency)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {site.photos.length > 1 && (
        <section className="mx-auto max-w-5xl px-5 py-10">
          <h2 className="mb-5 text-3xl font-bold">Nuestros trabajos</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {site.photos.slice(1).map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt={`Trabajo de ${site.name}`} className="aspect-square w-full rounded-xl object-cover" />
            ))}
          </div>
        </section>
      )}

      <section id="cotizacion" className="mx-auto grid max-w-5xl gap-8 px-5 py-12 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold">{cta}</h2>
          <p className="text-[var(--s-body)]">{site.copy?.leadIntro ?? "Déjanos tus datos y te contestamos hoy mismo."}</p>
          <dl className="flex flex-col gap-2 text-[var(--s-body)]">
            {site.hours && (
              <div>
                <dt className="inline font-semibold">Horario: </dt>
                <dd className="inline">{site.hours}</dd>
              </div>
            )}
            {site.address && (
              <div>
                <dt className="inline font-semibold">Dirección: </dt>
                <dd className="inline">{site.address}</dd>
              </div>
            )}
            {site.phone && (
              <div>
                <dt className="inline font-semibold">Teléfono: </dt>
                <dd className="inline">
                  <a href={`tel:${site.phone}`} className="underline underline-offset-4">
                    {site.phone}
                  </a>
                </dd>
              </div>
            )}
            {site.paymentMethods && site.paymentMethods.length > 0 && (
              <div>
                <dt className="inline font-semibold">{site.copy?.payments ?? "Aceptamos"}: </dt>
                <dd className="inline">{site.paymentMethods.join(", ")}</dd>
              </div>
            )}
          </dl>
          {wa && (
            <a href={wa} target="_blank" rel="noopener" className="inline-flex min-h-12 items-center self-start rounded-full bg-[#1d7a45] px-6 font-semibold text-white">
              {waLabel}
            </a>
          )}
        </div>
        {leadForm ?? (
          <div className="rounded-2xl border border-dashed border-[var(--s-line)] p-6 text-[var(--s-eyebrow)]">
            Aquí aparece el formulario de cotización.
          </div>
        )}
      </section>

      <footer className="border-t border-[var(--s-line)] px-5 py-6 text-center text-sm text-[var(--s-footer)]">
        {kit ? `${site.name} · ${kit.slogan}` : site.name} · Página hecha con Orbusiness
      </footer>
    </div>
  );
}
