import type { CSSProperties, ReactNode } from "react";
import { cmykText, contrast, fontsById, googleFontsHref, gradientCss, gradientEnd, onColor, paletteById, rgbText, type BrandKit } from "@/lib/brand";
import { logoSvg, svgDataUri } from "@/lib/brand-render";
import type { Tables } from "@/lib/database.types";
import { EmailSignature } from "./email-signature";
import { PrintButton } from "./print-button";

// Que los colores se impriman tal cual (el navegador quita los fondos al imprimir).
const exact: CSSProperties = { printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" };

const esc = (t: string) => t.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="flex break-before-page flex-col gap-6 border-t border-neutral-200 py-12 first-of-type:break-before-auto">
      <h2 className="flex items-baseline gap-3 text-3xl font-bold [font-family:var(--m-heading)]">
        <span className="text-base font-semibold text-[var(--m-primary)]">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

// El manual se arma solo con los datos del negocio y su kit (sirve para la vista previa local).
export async function BrandManual({
  b,
  kit,
  siteUrl,
  logoPngUrl,
}: {
  b: Pick<Tables<"businesses">, "name" | "owner_name" | "phone" | "address">;
  kit: BrandKit;
  siteUrl: string | null;
  logoPngUrl: string | null;
}) {
  const p = paletteById(kit.palette);
  const f = fontsById(kit.fonts);
  const [horizontal, vertical, blanco, mono, isotipo] = await Promise.all([
    logoSvg(kit, b.name, "horizontal"),
    logoSvg(kit, b.name, "vertical"),
    logoSvg(kit, b.name, "horizontal", "blanco"),
    logoSvg(kit, b.name, "horizontal", "mono"),
    logoSvg(kit, b.name, "isotipo"),
  ]);
  const logo = { horizontal: svgDataUri(horizontal), vertical: svgDataUri(vertical), blanco: svgDataUri(blanco), mono: svgDataUri(mono), isotipo: svgDataUri(isotipo) };

  const colors = [
    { role: "Principal", use: "Logo, botones y títulos", hex: p.primary },
    { role: "Secundario", use: "Detalles y fondos de apoyo", hex: p.secondary },
    { role: "Acento", use: "Ofertas y llamados de atención (poco)", hex: p.accent },
    { role: "Oscuro", use: "Textos", hex: p.dark },
    { role: "Claro", use: "Fondos", hex: p.light },
  ];

  // Firma de email: todos los datos del negocio van escapados.
  const signature = `<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${p.dark};line-height:1.45">
<tr>${logoPngUrl ? `<td style="padding-right:16px;border-right:3px solid ${p.primary};vertical-align:middle"><img src="${esc(logoPngUrl)}" alt="${esc(b.name)}" width="160" style="display:block;width:160px;height:auto"></td>` : ""}
<td style="padding-left:16px;vertical-align:middle">
<strong style="font-size:16px">${esc(b.owner_name ?? b.name)}</strong><br>
<span style="color:${p.primary};font-weight:bold">${esc(b.name)}</span><br>
${b.phone ? `${esc(b.phone)}<br>` : ""}${b.address ? `${esc(b.address)}<br>` : ""}${siteUrl ? `<a href="${esc(siteUrl)}" style="color:${p.primary}">${esc(siteUrl.replace(/^https:\/\//, ""))}</a><br>` : ""}
<em style="color:#666">${esc(kit.slogan)}</em>
</td></tr></table>`;

  const theme = {
    // Textos sobre blanco: el color principal si se lee bien, si no el oscuro.
    "--m-primary": contrast(p.primary, "#FFFFFF") >= 4.5 ? p.primary : p.dark,
    "--m-heading": `"${f.heading.family}", system-ui, sans-serif`,
    "--m-body": `"${f.body.family}", system-ui, sans-serif`,
  } as CSSProperties;

  return (
    <div style={theme} className="min-h-full bg-white text-neutral-900 [font-family:var(--m-body)]">
      <link rel="stylesheet" href={googleFontsHref([f])} precedence="default" />
      <style>{`@page { size: A4; margin: 14mm; }`}</style>

      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-4 py-3 print:hidden sm:px-8">
        <a href="/onboarding/marca#kit" className="min-h-11 content-center text-sm underline underline-offset-4">
          ← Volver
        </a>
        <PrintButton />
      </div>

      <main className="mx-auto flex max-w-4xl flex-col px-4 sm:px-8">
        {/* Portada */}
        <header className="flex min-h-[70vh] flex-col justify-center gap-10 py-16 print:min-h-[240mm]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo.isotipo} alt={`Isotipo de ${b.name}`} className="size-32 self-start" />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Manual de marca</p>
            <h1 className="text-5xl font-bold [font-family:var(--m-heading)]">{b.name}</h1>
            <p className="text-2xl text-neutral-600">{kit.slogan}</p>
          </div>
          <div className="h-4 rounded-full" style={{ ...exact, background: gradientCss(p) }} />
        </header>

        <Section n={1} title="Quiénes somos">
          <dl className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Propuesta de valor</dt>
              <dd className="text-lg">{kit.proposition}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Eslogan</dt>
              <dd className="text-lg">{kit.slogan}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Personalidad</dt>
              <dd className="text-lg">{kit.personality.join(" · ")}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Cómo hablamos</dt>
              <dd className="text-lg">{kit.tone}</dd>
            </div>
          </dl>
          <p className="text-neutral-600">{kit.concept}</p>
        </Section>

        <Section n={2} title="Logotipo">
          <p className="max-w-2xl text-neutral-600">
            El logo tiene dos partes: el <strong>isotipo</strong> (el símbolo) y el <strong>logotipo</strong> (el nombre
            escrito). Usa la versión que mejor quepa en cada lugar.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { src: logo.horizontal, label: "Horizontal — la principal", bg: "#FFFFFF" },
              { src: logo.vertical, label: "Vertical — para espacios cuadrados", bg: "#FFFFFF" },
              { src: logo.blanco, label: "En blanco — sobre fondos oscuros o fotos", bg: p.primary },
              { src: logo.mono, label: "A un color — sellos, bordados, fotocopias", bg: "#FFFFFF" },
              { src: logo.isotipo, label: "Isotipo — perfil de redes, ícono, favicon", bg: p.light },
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

        <Section n={3} title="Espacio y tamaño mínimo">
          <div className="grid items-center gap-8 sm:grid-cols-2">
            <div className="relative self-start rounded-xl border-2 border-dashed border-[var(--m-primary)] p-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.horizontal} alt="" className="w-full" />
              <span className="absolute left-2 top-1 text-xs font-semibold text-[var(--m-primary)]">X</span>
            </div>
            <ul className="flex list-disc flex-col gap-2 pl-5 text-neutral-700">
              <li>Deja libre alrededor del logo un espacio igual a la mitad del alto del símbolo (X). Ahí no va texto ni otra imagen.</li>
              <li>Tamaño mínimo del logo horizontal: 3 cm impreso o 120 px en pantalla.</li>
              <li>Tamaño mínimo del isotipo: 1 cm impreso o 32 px en pantalla.</li>
            </ul>
          </div>
        </Section>

        <Section n={4} title="Usos incorrectos">
          <p className="text-neutral-600">Para que tu marca siempre se reconozca, evita esto:</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "No lo estires ni lo aplastes", style: { transform: "scaleX(1.45)" } },
              { label: "No lo gires", style: { transform: "rotate(-14deg)" } },
              { label: "No le cambies los colores", style: { filter: "hue-rotate(150deg) saturate(1.6)" } },
              { label: "No lo pongas sobre fondos que no dejan leerlo", style: {}, bg: p.primary },
            ].map((u) => (
              <figure key={u.label} className="flex flex-col gap-2 break-inside-avoid">
                <div
                  className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 p-4"
                  style={{ ...exact, background: u.bg ?? "#FFFFFF" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo.horizontal} alt="" className="max-w-[80%]" style={u.style} />
                  <span aria-hidden className="absolute right-2 top-1 text-2xl font-bold text-red-600">
                    ✕
                  </span>
                </div>
                <figcaption className="text-sm text-neutral-600">{u.label}</figcaption>
              </figure>
            ))}
          </div>
        </Section>

        <Section n={5} title="Colores">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {colors.map((c) => (
              <div key={c.role} className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 break-inside-avoid">
                <div className="flex h-28 items-end p-3 text-sm font-semibold" style={{ ...exact, background: c.hex, color: onColor(c.hex, p.dark) }}>
                  {c.role}
                </div>
                <dl className="flex flex-col gap-0.5 p-3 font-mono text-xs text-neutral-700">
                  <div><dt className="inline font-semibold">HEX </dt><dd className="inline">{c.hex}</dd></div>
                  <div><dt className="inline font-semibold">RGB </dt><dd className="inline">{rgbText(c.hex)}</dd></div>
                  <div><dt className="inline font-semibold">CMYK </dt><dd className="inline">{cmykText(c.hex)}</dd></div>
                </dl>
                <p className="px-3 pb-3 text-xs text-neutral-500">{c.use}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-500">El CMYK es aproximado: tu imprenta lo ajusta a su máquina.</p>
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold [font-family:var(--m-heading)]">Degradado</h3>
            <div className="h-24 rounded-xl" style={{ ...exact, background: gradientCss(p) }} />
            <p className="font-mono text-xs text-neutral-700">
              {p.primary} → {gradientEnd(p)} · 135°
            </p>
            <p className="text-sm text-neutral-600">Para portadas, banners y fondos de publicaciones. Encima, el logo en blanco.</p>
          </div>
        </Section>

        <Section n={6} title="Tipografía">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-6 break-inside-avoid">
              <p className="text-sm text-neutral-500">Títulos</p>
              <p className="text-6xl [font-family:var(--m-heading)]" style={{ fontWeight: f.heading.weight }}>Aa</p>
              <p className="text-xl font-semibold">{f.heading.family}</p>
              <p className="text-lg [font-family:var(--m-heading)]" style={{ fontWeight: f.heading.weight }}>
                ABCDEFGHIJKLMNÑOPQRSTUVWXYZ 0123456789
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 p-6 break-inside-avoid">
              <p className="text-sm text-neutral-500">Textos</p>
              <p className="text-6xl">Aa</p>
              <p className="text-xl font-semibold">{f.body.family}</p>
              <p>{kit.proposition} Escríbenos y te atendemos con gusto.</p>
            </div>
          </div>
          <p className="text-sm text-neutral-600">
            Las dos son gratis: se descargan en fonts.google.com. Si no las tienes, usa Arial.
          </p>
        </Section>

        <Section n={7} title="Tarjeta de presentación">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex aspect-[9/5] items-center justify-center rounded-xl p-6 shadow-md" style={{ ...exact, background: gradientCss(p) }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.blanco} alt="" className="max-h-[45%] max-w-[85%]" />
            </div>
            <div className="flex aspect-[9/5] flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.horizontal} alt="" className="h-8 self-start" />
              <div className="flex flex-col text-sm">
                <strong className="text-base [font-family:var(--m-heading)]">{b.owner_name ?? b.name}</strong>
                {b.phone && <span>{b.phone}</span>}
                {b.address && <span>{b.address}</span>}
                {siteUrl && <span className="text-[var(--m-primary)]">{siteUrl.replace(/^https:\/\//, "")}</span>}
              </div>
            </div>
          </div>
          <p className="text-sm text-neutral-600">Tamaño 9 × 5 cm. Lleva este manual a tu imprenta.</p>
        </Section>

        <Section n={8} title="Firma de email">
          <EmailSignature html={signature} />
        </Section>

        <Section n={9} title="Redes sociales">
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <figure className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/marca/perfil.png" alt="" className="aspect-square w-full rounded-full border border-neutral-200 object-cover" />
              <figcaption className="text-sm text-neutral-600">Foto de perfil</figcaption>
            </figure>
            <figure className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/api/marca/portada.png" alt="" className="w-full rounded-xl border border-neutral-200" />
              <figcaption className="text-sm text-neutral-600">Portada de Facebook</figcaption>
            </figure>
          </div>
          <figure className="flex max-w-sm flex-col gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/api/marca/publicacion.png" alt="" className="w-full rounded-xl border border-neutral-200" />
            <figcaption className="text-sm text-neutral-600">Primera publicación: preséntate con tu nueva imagen</figcaption>
          </figure>
        </Section>

        <footer className="border-t border-neutral-200 py-8 text-sm text-neutral-500">
          Manual de marca de {b.name} · Hecho con Orbusiness
        </footer>
      </main>
    </div>
  );
}
