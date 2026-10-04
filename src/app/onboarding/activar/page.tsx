import { redirect } from "next/navigation";
import { Button, Card, PageTitle } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { activate } from "./actions";

const READY = [
  ["Página web", "Publicada, con formulario de cotización conectado a tu CRM."],
  ["CRM", "Con las etapas de tu trabajo. Cada cliente que llena el formulario aparece solo."],
  ["Perfil del negocio", "Servicios, precios, horario y forma de trabajar guardados para Nuna."],
];
const NEXT = [
  ["Número del negocio", "Llamadas, SMS y WhatsApp en un solo número.", "Fase 2"],
  ["Correo del negocio", "Bandeja creada; Nuna lee y contesta.", "Fase 2"],
  ["Nuna atendiendo", "Contesta, agenda y cotiza por todos los canales.", "Fase 2"],
  ["Cobros y contabilidad", "Tarjeta, Apple Pay, PayPal e ingresos automáticos.", "Fase 3"],
];

export default async function ActivatePage() {
  const { business } = await requireBusiness();
  if (["interview", "brand", "website", "crm"].includes(business.onboarding_step)) redirect("/onboarding/crm");

  return (
    <>
      <PageTitle
        title="Tu negocio está listo"
        lead="Esto ya funciona hoy. Lo demás lo va armando Orbusiness por ti: no tienes que conectar nada."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold text-lime">Listo ✓</h2>
          {READY.map(([title, text]) => (
            <div key={title}>
              <p className="font-semibold">{title}</p>
              <p className="text-muted">{text}</p>
            </div>
          ))}
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="font-semibold">Lo que sigue</h2>
          {NEXT.map(([title, text, phase]) => (
            <div key={title} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted">{text}</p>
              </div>
              <span className="shrink-0 rounded-full border border-line px-3 py-1 text-xs text-muted">{phase}</span>
            </div>
          ))}
        </Card>
      </div>
      <form action={activate}>
        <Button type="submit">Ir a mi panel</Button>
      </form>
    </>
  );
}
