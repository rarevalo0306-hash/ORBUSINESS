import type { ReactNode } from "react";
import { currencyName, priceLabel } from "@/lib/interview";
import type { SiteContent } from "@/lib/site";

// La página web de un negocio. Usa una paleta clara propia (no la de Orbusiness)
// porque es la página del negocio, no de la plataforma.
function whatsappLink(phone: string, name: string) {
  const text = encodeURIComponent(`Hola ${name}, quisiera información.`);
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${text}`;
}

export function SiteView({ site, leadForm }: { site: SiteContent; leadForm?: ReactNode }) {
  const cta = site.copy?.cta ?? site.ctaLabel;
  const wa = site.phone ? whatsappLink(site.phone, site.name) : null;
  const waLabel = site.copy?.whatsapp ?? "Escríbenos por WhatsApp";
  const waFirst = Boolean(wa && site.whatsappFirst !== false);
  const initials = site.name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-[#f4f1ea] font-sans text-[#1f2a1c]">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
        <div className="flex items-center gap-3">
          {site.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={site.logoUrl} alt={`Logo de ${site.name}`} className="size-12 rounded-lg object-contain" />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-lg bg-[#1f2a1c] font-display text-lg font-bold text-[#f4f1ea]">
              {initials}
            </span>
          )}
          <span className="font-display text-xl font-bold">{site.name}</span>
        </div>
        {waFirst ? (
          <a href={wa!} target="_blank" rel="noopener" className="hidden min-h-11 items-center rounded-full bg-[#1d7a45] px-5 font-semibold text-white sm:inline-flex">
            WhatsApp
          </a>
        ) : (
          <a href="#cotizacion" className="hidden min-h-11 items-center rounded-full bg-[#1f2a1c] px-5 font-semibold text-[#f4f1ea] sm:inline-flex">
            {cta}
          </a>
        )}
      </header>

      <section className="mx-auto grid max-w-5xl gap-8 px-5 py-10 md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#4a6b3e]">
            {site.industry}
            {site.zone ? ` · ${site.zone}` : ""}
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">{site.tagline}</h1>
          <p className="text-lg text-[#3d4a38]">{site.intro}</p>
          <div className="flex flex-wrap gap-3">
            {waFirst && (
              <a href={wa!} target="_blank" rel="noopener" className="inline-flex min-h-12 items-center rounded-full bg-[#1d7a45] px-6 font-semibold text-white">
                {waLabel}
              </a>
            )}
            <a
              href="#cotizacion"
              className={`inline-flex min-h-12 items-center rounded-full px-6 font-semibold ${waFirst ? "border border-[#1f2a1c]" : "bg-[#1f2a1c] text-[#f4f1ea]"}`}
            >
              {cta}
            </a>
          </div>
        </div>
        {site.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={site.photos[0]} alt={`Trabajo de ${site.name}`} className="aspect-[4/3] w-full rounded-2xl object-cover" />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-[#dfe6d6] text-[#4a6b3e]">
            {site.name}
          </div>
        )}
      </section>

      {site.services.length > 0 && (
        <section className="mx-auto max-w-5xl px-5 py-10">
          <h2 className="mb-2 font-display text-3xl font-bold">Lo que ofrecemos</h2>
          {site.secondaryCurrency && (
            <p className="mb-5 text-[#3d4a38]">
              Precios en {currencyName(site.currency)}; también aceptamos {currencyName(site.secondaryCurrency)}.
            </p>
          )}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {site.services.map((s) => (
              <li key={s.name} className="flex flex-col gap-1 rounded-2xl border border-[#d6dccd] bg-white p-5">
                <span className="text-lg font-semibold">{s.name}</span>
                <span className="text-[#4a6b3e]">{priceLabel(s.price, site.currency)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {site.photos.length > 1 && (
        <section className="mx-auto max-w-5xl px-5 py-10">
          <h2 className="mb-5 font-display text-3xl font-bold">Nuestros trabajos</h2>
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
          <h2 className="font-display text-3xl font-bold">{cta}</h2>
          <p className="text-[#3d4a38]">{site.copy?.leadIntro ?? "Déjanos tus datos y te contestamos hoy mismo."}</p>
          <dl className="flex flex-col gap-2 text-[#3d4a38]">
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
          <div className="rounded-2xl border border-dashed border-[#b9c4ad] p-6 text-[#4a6b3e]">
            Aquí aparece el formulario de cotización.
          </div>
        )}
      </section>

      <footer className="border-t border-[#d6dccd] px-5 py-6 text-center text-sm text-[#5d6b56]">
        {site.name} · Página hecha con Orbusiness
      </footer>
    </div>
  );
}
