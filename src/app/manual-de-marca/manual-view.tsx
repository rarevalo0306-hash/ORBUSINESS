import type { CSSProperties, ReactNode } from "react";
import {
  cmykText,
  contrast,
  fontsById,
  googleFontsHref,
  gradientCss,
  gradientEnd,
  kitPalette,
  onColor,
  patternCss,
  rgbText,
  type BrandBase,
  type BrandKit,
} from "@/lib/brand";
import { logoSvg, svgDataUri } from "@/lib/brand-render";
import { EmailSignature } from "./email-signature";
import { PrintButton } from "./print-button";

// Que los colores se impriman tal cual (el navegador quita los fondos al imprimir).
const exact: CSSProperties = { printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" };

const esc = (t: string) => t.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="flex break-before-page flex-col gap-6 border-t border-neutral-200 py-12">
      <h2 className="flex items-baseline gap-3 text-3xl font-bold [font-family:var(--m-heading)]">
        <span className="text-base font-semibold text-[var(--m-primary)]">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 break-inside-avoid">
      <dt className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className="text-lg">{children}</dd>
    </div>
  );
}

function Shot({ src, label, className = "" }: { src: string; label: string; className?: string }) {
  return (
    <figure className={`flex flex-col gap-2 break-inside-avoid ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} loading="lazy" className="w-full rounded-xl border border-neutral-200 bg-neutral-100" />
      <figcaption className="text-sm text-neutral-600">{label}</figcaption>
    </figure>
  );
}

// El manual se arma con los datos del negocio y su kit. img(id) = dirección de la imagen de cada pieza.
export async function BrandManual({
  name,
  owner,
  phone,
  address,
  kit,
  base,
  siteUrl,
  logoPngUrl,
  img,
}: {
  name: string;
  owner: string | null;
  phone: string | null;
  address: string | null;
  kit: BrandKit;
  base: BrandBase;
  siteUrl: string | null;
  logoPngUrl: string | null;
  img: (id: string) => string;
}) {
  const p = kitPalette(kit);
  const f = fontsById(kit.fonts);
  const [principal, vertical, blanco, mono, isotipo, sello] = await Promise.all([
    logoSvg(kit, name, "principal"),
    logoSvg(kit, name, "vertical"),
    logoSvg(kit, name, "principal", "blanco"),
    logoSvg(kit, name, "principal", "mono"),
    logoSvg(kit, name, "isotipo"),
    logoSvg(kit, name, "sello"),
  ]);
  const logo = {
    principal: svgDataUri(principal),
    vertical: svgDataUri(vertical),
    blanco: svgDataUri(blanco),
    mono: svgDataUri(mono),
    isotipo: svgDataUri(isotipo),
    sello: svgDataUri(sello),
  };
  const site = siteUrl?.replace(/^https:\/\//, "") ?? null;

  const colors = [
    { role: "Principal", use: "Logo, botones y títulos", hex: p.primary },
    { role: "Secundario", use: "Detalles y fondos de apoyo", hex: p.secondary },
    { role: "Acento", use: "Ofertas y llamados de atención (poco)", hex: p.accent },
    { role: "Oscuro", use: "Textos", hex: p.dark },
    { role: "Claro", use: "Fondos", hex: p.light },
  ];

  // Firma de email: todos los datos del negocio van escapados.
  const signature = `<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${p.dark};line-height:1.45">
<tr>${logoPngUrl ? `<td style="padding-right:16px;border-right:3px solid ${p.primary};vertical-align:middle"><img src="${esc(logoPngUrl)}" alt="${esc(name)}" width="160" style="display:block;width:160px;height:auto"></td>` : ""}
<td style="padding-left:16px;vertical-align:middle">
<strong style="font-size:16px">${esc(owner ?? name)}</strong><br>
<span style="color:${p.primary};font-weight:bold">${esc(name)}</span><br>
${phone ? `${esc(phone)}<br>` : ""}${address ? `${esc(address)}<br>` : ""}${site ? `<a href="${esc(siteUrl!)}" style="color:${p.primary}">${esc(site)}</a><br>` : ""}
<em style="color:#666">${esc(kit.slogan)}</em>
</td></tr></table>`;

  const theme = {
    // Textos sobre blanco: el color principal si se lee bien, si no el oscuro.
    "--m-primary": contrast(p.primary, "#FFFFFF") >= 4.5 ? p.primary : p.dark,
    "--m-heading": `"${f.heading.family}", system-ui, sans-serif`,
    "--m-body": `"${f.body.family}", system-ui, sans-serif`,
  } as CSSProperties;

  let n = 0;
  const next = () => ++n;

  return (
    <div style={theme} className="min-h-full bg-white text-neutral-900 [font-family:var(--m-body)]">
      <link rel="stylesheet" href={googleFontsHref([f])} precedence="default" />
      <style>{`@page { size: letter; margin: 12mm; }`}</style>

      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-4 py-3 print:hidden sm:px-8">
        <a href="/onboarding/marca#kit" className="min-h-11 content-center text-sm underline underline-offset-4">
          ← Volver
        </a>
        <PrintButton />
      </div>

      <main className="mx-auto flex max-w-4xl flex-col px-4 sm:px-8">
        {/* Portada */}
        <header className="flex min-h-[80vh] flex-col justify-center gap-10 py-16 print:min-h-[240mm]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={kit.layout === "emblema" ? logo.principal : logo.isotipo} alt={`Logo de ${name}`} className="size-36 self-start object-contain" />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Manual de marca</p>
            <h1 className="text-5xl font-bold [font-family:var(--m-heading)]">{name}</h1>
            <p className="text-2xl text-neutral-600">{kit.slogan}</p>
          </div>
          <div className="h-24 rounded-2xl" style={{ ...exact, backgroundImage: `${patternCss(kit, "#FFFFFF", 0.14)}, ${gradientCss(p)}` }} />
          <p className="text-sm text-neutral-500">Idea de marca: {kit.concept}</p>
        </header>

        <Section n={next()} title="Quiénes somos">
          <p className="text-xl leading-relaxed">{base.story}</p>
          <dl className="grid gap-6 sm:grid-cols-2">
            <Field label="Misión">{base.mission}</Field>
            <Field label="Visión">{base.vision}</Field>
            <Field label="Propuesta de valor">{kit.proposition}</Field>
            <Field label="Promesa de marca">{base.promise}</Field>
          </dl>
        </Section>

        <Section n={next()} title="Valores y cliente ideal">
          <div className="grid gap-4 sm:grid-cols-3">
            {base.values.map((v) => (
              <div key={v.name} className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-5 break-inside-avoid">
                <span className="text-xl font-bold text-[var(--m-primary)] [font-family:var(--m-heading)]">{v.name}</span>
                <span className="text-neutral-700">{v.text}</span>
              </div>
            ))}
          </div>
          <dl>
            <Field label="Nuestro cliente ideal">{base.audience}</Field>
          </dl>
        </Section>

        <Section n={next()} title="Personalidad y forma de hablar">
          <dl className="grid gap-6 sm:grid-cols-2">
            <Field label="Personalidad">{kit.personality.join(" · ")}</Field>
            <Field label="Tono de voz">{kit.tone}</Field>
          </dl>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-xl border border-green-200 bg-green-50 p-5 break-inside-avoid" style={exact}>
              <span className="font-semibold text-green-800">Así sí hablamos</span>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {base.voiceDo.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-5 break-inside-avoid" style={exact}>
              <span className="font-semibold text-red-800">Así no</span>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {base.voiceDont.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
          <dl>
            <Field label="Mensajes clave">
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {base.messages.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </Field>
          </dl>
        </Section>

        <Section n={next()} title="Logotipo">
          <p className="max-w-2xl text-neutral-600">
            Tu logo tiene el <strong>isotipo</strong> (el símbolo) y el <strong>logotipo</strong> (el nombre escrito). Usa la versión
            que mejor quepa en cada lugar.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { src: logo.principal, label: "Principal — la que más se usa", bg: "#FFFFFF" },
              { src: logo.vertical, label: "Vertical — para espacios cuadrados", bg: "#FFFFFF" },
              { src: logo.blanco, label: "En blanco — sobre fondos oscuros o fotos", bg: p.primary },
              { src: logo.mono, label: "A un color — bordados, fotocopias, grabados", bg: "#FFFFFF" },
              { src: logo.isotipo, label: "Isotipo — perfil de redes, ícono, favicon", bg: p.light },
              { src: logo.sello, label: "Sello — empaques, facturas, stickers", bg: "#FFFFFF" },
            ].map((v) => (
              <figure key={v.label} className="flex flex-col gap-2 break-inside-avoid">
                <div className="flex h-44 items-center justify-center rounded-xl border border-neutral-200 p-6" style={{ ...exact, background: v.bg }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.src} alt="" className="max-h-full max-w-full" />
                </div>
                <figcaption className="text-sm text-neutral-600">{v.label}</figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section n={next()} title="Espacio, tamaño y usos incorrectos">
          <div className="grid items-center gap-8 sm:grid-cols-2">
            <div className="relative self-start rounded-xl border-2 border-dashed border-[var(--m-primary)] p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.principal} alt="" className="mx-auto max-h-40" />
              <span className="absolute left-2 top-1 text-xs font-semibold text-[var(--m-primary)]">X</span>
            </div>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-neutral-700">
              <li>Deja libre alrededor del logo un espacio igual a la mitad del alto del símbolo (X).</li>
              <li>Tamaño mínimo: 3 cm impreso o 120 px en pantalla. El isotipo: 1 cm o 32 px.</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "No lo estires ni lo aplastes", style: { transform: "scaleX(1.45)" } },
              { label: "No lo gires", style: { transform: "rotate(-14deg)" } },
              { label: "No le cambies los colores", style: { filter: "hue-rotate(150deg) saturate(1.6)" } },
              { label: "No lo pongas donde no se lee", style: {}, bg: p.primary },
            ].map((u) => (
              <figure key={u.label} className="flex flex-col gap-2 break-inside-avoid">
                <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 p-4" style={{ ...exact, background: u.bg ?? "#FFFFFF" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo.principal} alt="" className="max-h-[70%] max-w-[80%]" style={u.style} />
                  <span aria-hidden className="absolute right-2 top-1 text-2xl font-bold text-red-600">
                    ✕
                  </span>
                </div>
                <figcaption className="text-sm text-neutral-600">{u.label}</figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section n={next()} title="Colores">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {colors.map((c) => (
              <div key={c.role} className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 break-inside-avoid">
                <div className="flex h-28 items-end p-3 text-sm font-semibold" style={{ ...exact, background: c.hex, color: onColor(c.hex, p.dark) }}>
                  {c.role}
                </div>
                <dl className="flex flex-col gap-0.5 p-3 font-mono text-xs text-neutral-700">
                  <div>
                    <dt className="inline font-semibold">HEX </dt>
                    <dd className="inline">{c.hex}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">RGB </dt>
                    <dd className="inline">{rgbText(c.hex)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">CMYK </dt>
                    <dd className="inline">{cmykText(c.hex)}</dd>
                  </div>
                </dl>
                <p className="px-3 pb-3 text-xs text-neutral-500">{c.use}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-500">El CMYK es aproximado: tu imprenta lo ajusta a su máquina.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 break-inside-avoid">
              <h3 className="text-xl font-bold [font-family:var(--m-heading)]">Degradado</h3>
              <div className="h-28 rounded-xl" style={{ ...exact, background: gradientCss(p) }} />
              <p className="font-mono text-xs text-neutral-700">
                {p.primary} → {gradientEnd(p)} · 135°
              </p>
            </div>
            <div className="flex flex-col gap-2 break-inside-avoid">
              <h3 className="text-xl font-bold [font-family:var(--m-heading)]">Patrón</h3>
              <div className="h-28 rounded-xl border border-neutral-200" style={{ ...exact, background: p.light, backgroundImage: patternCss(kit, p.primary, 0.35, 56) }} />
              <p className="text-xs text-neutral-600">Para fondos, empaques, bolsas y detalles. Siempre suave, que no compita con el logo.</p>
            </div>
          </div>
        </Section>

        <Section n={next()} title="Tipografía">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-6 break-inside-avoid">
              <p className="text-sm text-neutral-500">Títulos</p>
              <p className="text-6xl [font-family:var(--m-heading)]" style={{ fontWeight: f.heading.weight }}>
                Aa
              </p>
              <p className="text-xl font-semibold">{f.heading.family}</p>
              <p className="text-lg [font-family:var(--m-heading)]" style={{ fontWeight: f.heading.weight }}>
                ABCDEFGHIJKLMNÑOPQRSTUVWXYZ 0123456789
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-6 break-inside-avoid">
              <p className="text-sm text-neutral-500">Textos</p>
              <p className="text-6xl">Aa</p>
              <p className="text-xl font-semibold">{f.body.family}</p>
              <p>{kit.proposition}</p>
            </div>
          </div>
          <p className="text-sm text-neutral-600">Las dos son gratis: se descargan en fonts.google.com. Si no las tienes a mano, usa Arial.</p>
        </Section>

        <Section n={next()} title="Fotos">
          <p className="max-w-2xl text-lg">{base.photoStyle}</p>
        </Section>

        <Section n={next()} title="Redes sociales">
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Shot src={img("perfil.png")} label="Foto de perfil" />
            <Shot src={img("portada.png")} label="Portada de Facebook" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Shot src={img("publicacion.png")} label="Primera publicación: preséntate con tu nueva imagen" />
            <Shot src={img("historia.png")} label="Historia / Estado de WhatsApp" />
          </div>
          <dl className="grid gap-6 sm:grid-cols-2">
            <Field label="Bio para Instagram y Facebook">{base.bio}</Field>
            <Field label="Descripción para Google y WhatsApp Business">{base.description}</Field>
            <Field label="Mensaje de bienvenida de WhatsApp">{base.whatsappWelcome}</Field>
            <Field label="Hashtags">{base.hashtags.join(" ")}</Field>
          </dl>
          <dl>
            <Field label="Ideas de publicaciones">
              <ol className="flex list-decimal flex-col gap-1 pl-5">
                {base.postIdeas.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </Field>
          </dl>
        </Section>

        <Section n={next()} title="Papelería">
          <div className="grid gap-4 sm:grid-cols-2">
            <Shot src={img("tarjeta.png")} label="Tarjeta de presentación (90 × 50 mm, PDF listo para imprenta con las 2 caras)" />
            <Shot src={img("volante.png")} label="Volante" />
            <Shot src={img("membrete.png")} label="Hoja membretada (PDF y Word)" />
            <Shot src={img("cotizacion.png")} label="Formato de cotización" />
          </div>
        </Section>

        <Section n={next()} title="Tu marca en la vida real">
          <div className="grid gap-4 sm:grid-cols-2">
            <Shot src={img("letrero.png")} label="Letrero del local" />
            <Shot src={img("camiseta.png")} label="Camiseta / uniforme" />
            <Shot src={img("bolsa.png")} label="Bolsa" />
            <Shot src={img("vehiculo.png")} label="Vehículo de reparto" />
          </div>
          <Shot src={img("chat.png")} label="Así se ve tu WhatsApp" className="max-w-xs" />
        </Section>

        <Section n={next()} title="Firma de email">
          <EmailSignature html={signature} />
        </Section>

        <footer className="border-t border-neutral-200 py-8 text-sm text-neutral-500">Manual de marca de {name} · Hecho con Orbusiness</footer>
      </main>
    </div>
  );
}
