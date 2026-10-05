import "server-only";
import { ImageResponse } from "next/og";
import { gradientCss, onColor, paletteById, type BrandKit } from "@/lib/brand";
import { isotypeOnColor, kitFonts, logoPng, logoSvg, svgDataUri, type LogoLayout, type LogoTheme } from "@/lib/brand-render";
import type { Tables } from "@/lib/database.types";

// Archivos del kit de marca (logos en SVG/PNG e imágenes para redes).
const SVGS: Record<string, [LogoLayout, LogoTheme]> = {
  "logo-horizontal.svg": ["horizontal", "color"],
  "logo-vertical.svg": ["vertical", "color"],
  "logo-blanco.svg": ["horizontal", "blanco"],
  "logo-un-color.svg": ["horizontal", "mono"],
  "isotipo.svg": ["isotipo", "color"],
};
const PNGS = ["logo-horizontal.png", "isotipo.png", "perfil.png", "portada.png", "publicacion.png"];

export const isBrandFile = (archivo: string) => Boolean(SVGS[archivo]) || PNGS.includes(archivo);

export async function brandFile(kit: BrandKit, b: Pick<Tables<"businesses">, "name" | "zone" | "phone">, archivo: string) {
  const name = b.name;
  const download = { "Content-Disposition": `attachment; filename="${archivo}"`, "Cache-Control": "private, no-store" };

  if (SVGS[archivo]) {
    const [layout, theme] = SVGS[archivo];
    return new Response(await logoSvg(kit, name, layout, theme), {
      headers: { ...download, "Content-Type": "image/svg+xml" },
    });
  }

  const p = paletteById(kit.palette);
  const { pair, heading, body } = await kitFonts(kit);
  const fonts = [
    { name: "Heading", data: heading, weight: pair.heading.weight as 400 | 600 | 700, style: "normal" as const },
    { name: "Body", data: body, weight: pair.body.weight as 400, style: "normal" as const },
  ];
  const options = (width: number, height: number) => ({ width, height, fonts, headers: download });

  if (archivo === "logo-horizontal.png" || archivo === "isotipo.png") {
    const isotipo = archivo === "isotipo.png";
    return logoPng(kit, name, isotipo ? "isotipo" : "horizontal", isotipo ? 1000 : 1600, download);
  }

  if (archivo === "perfil.png") {
    const iso = await isotypeOnColor(kit, name, p.primary, 520);
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: p.primary }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgDataUri(iso)} width={520} height={520} alt="" />
      </div>,
      options(1000, 1000),
    );
  }

  const ink = onColor(p.primary, p.dark);
  if (archivo === "portada.png") {
    const iso = await isotypeOnColor(kit, name, p.primary, 180);
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 48, backgroundImage: gradientCss(p), padding: 80 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgDataUri(iso)} width={180} height={180} alt="" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, color: ink, maxWidth: 1100 }}>
          <div style={{ fontFamily: "Heading", fontSize: 92, lineHeight: 1 }}>{name}</div>
          <div style={{ fontFamily: "Body", fontSize: 44, opacity: 0.92 }}>{kit.slogan}</div>
        </div>
      </div>,
      options(1640, 624),
    );
  }

  // publicacion.png: post de presentación para redes sociales.
  const iso = await logoSvg(kit, name, "isotipo");
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: p.light, padding: 90, color: p.dark }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={svgDataUri(iso)} width={110} height={110} alt="" />
        <div style={{ fontFamily: "Heading", fontSize: 52 }}>{name}</div>
      </div>
      <div style={{ fontFamily: "Heading", fontSize: 96, lineHeight: 1.05, color: p.primary }}>{kit.slogan}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ width: 180, height: 14, backgroundImage: gradientCss(p), borderRadius: 7 }} />
        <div style={{ fontFamily: "Body", fontSize: 40 }}>{[b.zone, b.phone].filter(Boolean).join("  ·  ")}</div>
      </div>
    </div>,
    options(1080, 1080),
  );
}
