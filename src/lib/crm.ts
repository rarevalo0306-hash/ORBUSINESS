// Convierte el workflow que Nuna entendió en la entrevista en un CRM a la medida:
// etapas, datos de cada cliente y automatizaciones. Tiendas y negocios de servicios
// tienen recorridos distintos.

import type { Tables } from "@/lib/database.types";
import { marketFor } from "@/lib/markets";

type Workflow = Pick<
  Tables<"businesses">,
  | "business_type"
  | "visit_before_quote"
  | "payment_timing"
  | "has_recurring_clients"
  | "quote_requires_approval"
  | "offers_delivery"
  | "industry"
  | "country_code"
>;

export type StageDef = { key: string; name: string; automations: string[] };

const quoteAutomation = (b: Workflow) =>
  `${b.quote_requires_approval ? "Te pide OK y la manda" : "La manda"} con enlace de pago; si no responden en 2 días, da seguimiento`;

// Tienda: el cliente pregunta, compra (al momento, con apartado o a crédito), se entrega y vuelve.
function storeStages(b: Workflow): StageDef[] {
  const s: StageDef[] = [
    {
      key: "lead",
      name: "Interesado",
      automations: ["Nuna contesta en menos de un minuto: precio, disponibilidad y horario"],
    },
    { key: "quoted", name: "Cotizado", automations: [quoteAutomation(b)] },
  ];
  if (b.payment_timing === "deposit")
    s.push({ key: "reserved", name: "Apartado", automations: ["Registra el anticipo y recuerda al cliente pasar por su pedido"] });
  s.push({
    key: "sold",
    name: "Vendido",
    automations: ["Registra la venta en contabilidad y manda el recibo"],
  });
  if (b.offers_delivery)
    s.push({ key: "delivered", name: "Entregado", automations: ["Avisa al cliente cuándo llega su pedido y confirma la entrega"] });
  if (b.payment_timing === "credit")
    s.push(
      { key: "credit", name: "Por cobrar", automations: ["Recuerda al cliente su saldo antes de la fecha de pago"] },
      { key: "paid", name: "Pagado", automations: ["Registra el pago y manda el recibo"] },
    );
  if (b.has_recurring_clients)
    s.push({ key: "recurring", name: "Cliente frecuente", automations: ["Le avisa de ofertas y le ofrece volver a pedir lo de siempre"] });
  return s;
}

// Servicios: el cliente pide un trabajo, se cotiza, se agenda, se hace y se cobra.
function serviceStages(b: Workflow): StageDef[] {
  const s: StageDef[] = [
    {
      key: "lead",
      name: "Lead nuevo",
      automations: ["Nuna contesta en menos de un minuto por el canal donde escribió y pide los datos del trabajo"],
    },
  ];
  if (b.visit_before_quote)
    s.push({ key: "visit", name: "Visita agendada", automations: ["Confirma la visita y manda recordatorio un día antes"] });
  s.push({ key: "quoted", name: "Cotizado", automations: [quoteAutomation(b)] });
  const job: StageDef = { key: "scheduled", name: "Trabajo agendado", automations: ["Recordatorio al cliente y tu ruta del día"] };
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
      { key: "deposit", name: "Anticipo pagado", automations: ["Cobra el anticipo (50%) al aceptar y agenda el trabajo"] },
      job,
      done,
      paid,
    );
  } else if (b.payment_timing === "credit") {
    done.automations = ["Registra el trabajo y el saldo a crédito del cliente"];
    s.push(job, done, { key: "credit", name: "Por cobrar", automations: ["Recuerda al cliente su saldo antes de la fecha de pago"] }, paid);
  } else {
    s.push(job, done, paid);
  }
  if (b.has_recurring_clients)
    s.push({ key: "recurring", name: "Cliente recurrente", automations: ["Agenda el siguiente servicio solo y le avisa al cliente"] });
  return s;
}

export function stagesFor(b: Workflow): StageDef[] {
  return b.business_type === "products" ? storeStages(b) : serviceStages(b);
}

export function fieldsFor(b: Workflow): string[] {
  const m = marketFor(b.country_code);
  const references = m && /referencia/.test(m.addressStyle) ? " con puntos de referencia" : "";
  const f = [`Nombre, WhatsApp${m ? ` (+${m.dialCode})` : ""} y email`];
  if (b.business_type === "products") {
    f.push("Productos que le interesan");
    if (b.offers_delivery) f.push(`Dirección de entrega${references}`);
    if (b.payment_timing === "credit") f.push("Saldo a crédito y fecha de pago");
  } else {
    f.push(
      `Dirección del trabajo${references}`,
      "Servicio que le interesa",
      (b.industry ?? "").toLowerCase().includes("jardin") ? "Tamaño del jardín y fotos del lugar" : "Detalles y fotos del trabajo",
    );
  }
  f.push("Canal por donde llegó");
  if (b.has_recurring_clients) f.push(b.business_type === "products" ? "Qué compra seguido" : "Frecuencia del servicio");
  f.push("Historial de cotizaciones, compras y pagos");
  return f;
}
