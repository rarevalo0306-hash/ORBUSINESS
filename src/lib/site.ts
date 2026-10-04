// Contenido de la página web de un negocio. Se guarda como copia (snapshot) en websites.content
// al publicar, para que el sitio público no necesite leer otras tablas.

import type { Tables } from "@/lib/database.types";
import { norm } from "@/lib/interview";

export type SiteContent = {
  name: string;
  tagline: string;
  intro: string;
  industry: string;
  zone: string;
  hours: string;
  services: { name: string; price: number | null }[];
  logoUrl: string | null;
  photos: string[];
  ctaLabel: string;
};

const TAGLINES: [string, string][] = [
  ["jardin", "Tu jardín impecable, sin que tengas que pensarlo"],
  ["limpi", "Tu casa limpia y en orden, cuando la necesitas"],
  ["salon", "Luce increíble, con cita cuando te queda"],
  ["belleza", "Luce increíble, con cita cuando te queda"],
  ["taller", "Tu auto en buenas manos, con precio claro"],
  ["mecan", "Tu auto en buenas manos, con precio claro"],
  ["plom", "Arreglamos la fuga hoy, con precio claro"],
  ["pint", "Paredes como nuevas, sin complicaciones"],
];

export function slugify(name: string) {
  return (
    norm(name)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "mi-negocio"
  );
}

export function buildSiteContent(
  b: Tables<"businesses">,
  services: Tables<"services">[],
  logoUrl: string | null,
  photos: string[],
): SiteContent {
  const industry = b.industry ?? "Servicios";
  const key = norm(industry);
  const tagline =
    TAGLINES.find(([k]) => key.includes(k))?.[1] ?? `${industry} con atención personal y precios claros`;
  const intro = [
    `Somos ${b.name}${b.zone ? `, en ${b.zone}` : ""}.`,
    b.visit_before_quote
      ? "Pasamos a ver tu trabajo sin costo y te damos un precio claro."
      : "Pide tu cotización y te respondemos en minutos.",
    b.has_recurring_clients ? "También tenemos servicio fijo cada semana o cada mes." : "",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    name: b.name,
    tagline,
    intro,
    industry,
    zone: b.zone ?? "",
    hours: b.hours ?? "",
    services: services
      .filter((s) => s.active)
      .map((s) => ({ name: s.name, price: s.price === null ? null : Number(s.price) })),
    logoUrl,
    photos,
    ctaLabel: b.visit_before_quote ? "Agenda una visita gratis" : "Pide tu cotización",
  };
}
