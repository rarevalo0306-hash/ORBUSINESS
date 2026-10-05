import { fontsById, initials, isotypeSvg, paletteById, type BrandKit } from "@/lib/brand";

// Logo de un kit de marca para mostrar en pantalla (isotipo en SVG + nombre con la tipografía del kit).
// La tipografía se carga con googleFontsHref(); las descargas usan lib/brand-render.ts (texto en trazos).
// El SVG sale solo de piezas curadas (lib/brand.ts) y las iniciales van escapadas.
export function BrandLogo({
  kit,
  name,
  layout = "horizontal",
  size = 48,
  theme = "color",
  className = "",
}: {
  kit: BrandKit;
  name: string;
  layout?: "horizontal" | "vertical" | "isotipo";
  size?: number;
  theme?: "color" | "blanco" | "mono";
  className?: string;
}) {
  const p = paletteById(kit.palette);
  const f = fontsById(kit.fonts);
  const mono = theme === "blanco" ? "#FFFFFF" : theme === "mono" ? p.dark : undefined;
  const isoKit = theme === "blanco" ? { ...kit, shape: "none" as const } : kit;
  const svg = isotypeSvg(isoKit, { size, mono, initials: initials(name) });
  const iso = (
    <span
      aria-hidden
      className="inline-block shrink-0"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
  if (layout === "isotipo") {
    return (
      <span role="img" aria-label={`Isotipo de ${name}`} className={`inline-flex ${className}`}>
        {iso}
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={`Logo de ${name}`}
      className={`inline-flex items-center ${layout === "vertical" ? "flex-col text-center" : ""} ${className}`}
      style={{ gap: size * 0.25 }}
    >
      {iso}
      <span
        style={{
          fontFamily: `"${f.heading.family}", system-ui, sans-serif`,
          fontWeight: f.heading.weight,
          fontSize: size * (layout === "vertical" ? 0.42 : 0.5),
          lineHeight: 1.1,
          color: theme === "blanco" ? "#FFFFFF" : p.dark,
        }}
      >
        {name}
      </span>
    </span>
  );
}
