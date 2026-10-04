// Convierte el workflow que Nuna entendió en la entrevista en un CRM a la medida:
// etapas, datos de cada cliente y automatizaciones.

import type { Tables } from "@/lib/database.types";

type Workflow = Pick<
  Tables<"businesses">,
  "visit_before_quote" | "payment_timing" | "has_recurring_clients" | "quote_requires_approval" | "industry"
>;

export type StageDef = { key: string; name: string; automations: string[] };

export function stagesFor(b: Workflow): StageDef[] {
  const s: StageDef[] = [
    {
      key: "lead",
      name: "Lead nuevo",
      automations: ["Nuna contesta en menos de un minuto por el canal donde escribió y pide los datos del trabajo"],
    },
  ];
  if (b.visit_before_quote)
    s.push({
      key: "visit",
      name: "Visita agendada",
      automations: ["Confirma la visita y manda recordatorio un día antes"],
    });
  s.push({
    key: "quoted",
    name: "Cotizado",
    automations: [
      `${b.quote_requires_approval ? "Te pide OK y la manda" : "La manda"} con enlace de pago; si no responden en 2 días, da seguimiento`,
    ],
  });
  const job: StageDef = {
    key: "scheduled",
    name: "Trabajo agendado",
    automations: ["Recordatorio al cliente y tu ruta del día"],
  };
  const done: StageDef = {
    key: "done",
    name: "Trabajo hecho",
    automations: ["Manda factura con enlace de pago y recuerda si no pagan"],
  };
  const paid: StageDef = {
    key: "paid",
    name: "Pagado",
    automations: ["Recibo automático, se registra en contabilidad y pide reseña en Google"],
  };
  if (b.payment_timing === "before") {
    paid.automations.unshift("Cobra el total al aceptar, antes de agendar el trabajo");
    done.automations = ["Pide reseña y confirma que todo quedó bien"];
    s.push(paid, job, done);
  } else if (b.payment_timing === "deposit") {
    s.push(
      {
        key: "deposit",
        name: "Anticipo pagado",
        automations: ["Cobra el anticipo (50%) al aceptar y agenda el trabajo"],
      },
      job,
      done,
      paid,
    );
  } else {
    s.push(job, done, paid);
  }
  if (b.has_recurring_clients)
    s.push({
      key: "recurring",
      name: "Cliente recurrente",
      automations: ["Agenda el siguiente servicio solo y le avisa al cliente"],
    });
  return s;
}

export function fieldsFor(b: Workflow): string[] {
  const f = ["Nombre, teléfono y email", "Dirección del trabajo", "Servicio que le interesa", "Canal por donde llegó"];
  f.push(
    (b.industry ?? "").toLowerCase().includes("jardin")
      ? "Tamaño del jardín y fotos del lugar"
      : "Detalles y fotos del trabajo",
  );
  if (b.has_recurring_clients) f.push("Frecuencia del servicio");
  f.push("Historial de cotizaciones, citas y pagos");
  return f;
}
