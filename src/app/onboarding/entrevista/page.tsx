import { ButtonLink, Card, PageTitle } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { QUESTIONS, money } from "@/lib/interview";
import { nunaUsesClaude } from "@/lib/nuna";
import { InterviewChat } from "./chat";

export default async function InterviewPage() {
  const { supabase, business } = await requireBusiness();
  const [{ data: messages }, { data: services }] = await Promise.all([
    supabase
      .from("interview_messages")
      .select("id, role, content, step_key")
      .eq("business_id", business.id)
      .order("created_at"),
    supabase.from("services").select("name, price").eq("business_id", business.id).order("sort"),
  ]);

  const last = messages?.filter((m) => m.role === "nuna").at(-1);
  const current = QUESTIONS.find((q) => q.key === last?.step_key) ?? null;
  const done = business.onboarding_step !== "interview";

  const understood: [string, string | null][] = [
    ["Negocio", business.name === "Mi negocio" ? null : business.name],
    ["Dueño", business.owner_name],
    ["A qué se dedica", business.industry],
    ["Servicios", services?.length ? services.map((s) => `${s.name} ${money(s.price)}`).join(" · ") : null],
    ["Zona", business.zone],
    ["Horario", business.hours],
    ["Cómo llegan los clientes", business.lead_sources],
    ["Antes de cotizar", business.visit_before_quote === null ? null : business.visit_before_quote ? "Visita primero" : "Cotiza directo"],
    ["Cuándo cobra", { before: "Antes de empezar", deposit: "Anticipo + resto al terminar", after: "Al terminar" }[business.payment_timing ?? ""] ?? null],
    ["Clientes recurrentes", business.has_recurring_clients === null ? null : business.has_recurring_clients ? "Sí" : "No"],
    ["Cotizaciones", !done ? null : business.quote_requires_approval ? "Las revisa antes de enviar" : "Nuna las manda sola"],
  ];

  return (
    <>
      <PageTitle
        title="Platícame de tu negocio"
        lead={
          nunaUsesClaude()
            ? "Contesta con tus palabras. Nuna (con IA) entiende tus respuestas y arma todo con ellas."
            : "Contesta con tus palabras. Nuna está en modo básico (sin llave de IA todavía): entiende respuestas sencillas."
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <InterviewChat messages={messages ?? []} open={!done} example={current?.example ?? null} />
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold">Lo que Nuna entendió</h2>
          <dl className="flex flex-col gap-3">
            {understood.map(([label, value]) => (
              <div key={label} className="border-b border-line pb-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
                <dd>{value ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
      {done && (
        <ButtonLink href="/onboarding/marca" className="self-start">
          Seguir: logo, fotos y web →
        </ButtonLink>
      )}
    </>
  );
}
