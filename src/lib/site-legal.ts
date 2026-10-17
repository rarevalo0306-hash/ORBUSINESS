// Páginas legales de la página de cada negocio: aviso de privacidad, términos y condiciones, y envíos y devoluciones.
// Plantillas fijas (no IA) con los datos del negocio y la ley de datos personales de su país.
// shortcut: son una base general, no asesoría legal; cada dueño debe revisarlas con un abogado de su país.

import type { SiteContent } from "@/lib/site";

export type LegalPage = "privacidad" | "terminos" | "envios";
export type LegalDoc = { title: string; sections: { title: string; text: string[] }[] };

// Ley de protección de datos personales por país (para citarla en el aviso).
const LAWS: Record<string, string> = {
  MX: "la Ley Federal de Protección de Datos Personales en Posesión de los Particulares",
  GT: "las leyes de Guatemala aplicables a la información personal",
  HN: "las leyes de Honduras aplicables a la información personal",
  SV: "la Ley de Protección de Datos Personales de El Salvador",
  NI: "la Ley 787, Ley de Protección de Datos Personales de Nicaragua",
  CR: "la Ley 8968, Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales de Costa Rica",
  PA: "la Ley 81 de 2019 sobre Protección de Datos Personales de Panamá",
  US: "las leyes de privacidad aplicables en los Estados Unidos, incluida la ley de California (CCPA/CPRA) para residentes de ese estado",
  CA: "la Ley de Protección de Información Personal y Documentos Electrónicos de Canadá (PIPEDA)",
};

export const legalPages = (site: SiteContent): { path: LegalPage; label: string }[] => [
  { path: "privacidad", label: "Aviso de privacidad" },
  { path: "terminos", label: "Términos y condiciones" },
  ...(site.kind !== "services" ? [{ path: "envios" as const, label: "Envíos y devoluciones" }] : []),
];

export function legalDoc(site: SiteContent, page: LegalPage): LegalDoc {
  const name = site.name;
  const law = LAWS[site.countryCode ?? ""] ?? "las leyes de protección de datos personales aplicables en tu país";
  const contact = [site.phone && `el teléfono o WhatsApp ${site.phone}`, "el formulario de contacto de esta página"].filter(Boolean).join(" o ");
  const where = [site.address, site.zone].filter(Boolean).join(", ");
  const co = site.checkout;

  if (page === "privacidad") {
    return {
      title: "Aviso de privacidad",
      sections: [
        { title: "Quién es responsable de tus datos", text: [`${name}${where ? `, con domicilio en ${where}` : ""}, es responsable del tratamiento de los datos personales que nos compartes en esta página, de acuerdo con ${law}.`] },
        {
          title: "Qué datos recabamos",
          text: [
            "Solo los que tú nos das al contactarnos, comprar, pedir una cotización o agendar una cita: nombre, teléfono o WhatsApp, correo electrónico, dirección de entrega (si pides envío) y lo que nos escribas.",
            "No recabamos datos sensibles. No guardamos datos de tarjetas: si pagas en línea, el pago lo procesa directamente una plataforma de pagos segura.",
          ],
        },
        {
          title: "Para qué los usamos",
          text: [
            "Para atender tu mensaje, preparar y entregar tu pedido, darte una cotización, confirmar o recordarte tu cita, y darte seguimiento como cliente.",
            "No vendemos ni rentamos tus datos. Solo los compartimos con los servicios que necesitamos para operar (por ejemplo, la plataforma de nuestra página y de mensajes, el correo, WhatsApp y, si aplica, el servicio de entrega o de pagos), que los usan solo para eso.",
          ],
        },
        {
          title: "Asistente virtual",
          text: ["Algunos mensajes pueden ser contestados por Nuna, nuestra asistente virtual, con la información de nuestro negocio. Siempre puedes pedir hablar con una persona."],
        },
        {
          title: "Tus derechos",
          text: [
            "Puedes pedirnos en cualquier momento ver, corregir o borrar tus datos, o que dejemos de usarlos (en México, derechos ARCO: acceso, rectificación, cancelación y oposición).",
            `Escríbenos por ${contact}. Te respondemos en un plazo máximo de 20 días hábiles.`,
          ],
        },
        {
          title: "Cookies y almacenamiento",
          text: ["Esta página no usa cookies de publicidad ni de rastreo. Solo guarda en tu navegador lo necesario para que funcione, como tu carrito de compras."],
        },
        { title: "Cambios a este aviso", text: ["Si cambiamos este aviso, publicaremos la nueva versión en esta misma página."] },
      ],
    };
  }

  if (page === "terminos") {
    return {
      title: "Términos y condiciones",
      sections: [
        { title: "Uso de esta página", text: [`Esta página es de ${name}. Al usarla, comprar o agendar una cita, aceptas estos términos.`] },
        {
          title: "Productos, servicios y precios",
          text: [
            `Los precios están en ${site.currency} e incluyen o no impuestos según la ley local; si algo cambia, te lo confirmamos antes de cobrar.`,
            "Los productos están sujetos a disponibilidad. Los servicios «a cotizar» o «desde» se confirman después de conocer lo que necesitas.",
            "Las fotos son ilustrativas y pueden variar ligeramente del producto real.",
          ],
        },
        {
          title: "Pedidos y pagos",
          text: [
            "Un pedido queda confirmado cuando te lo confirmamos por mensaje o correo. Podemos rechazar o cancelar un pedido si hay un error de precio o falta de existencias; en ese caso te devolvemos lo que hayas pagado.",
            site.paymentMethods?.length ? `Aceptamos: ${site.paymentMethods.join(", ")}.` : "Te confirmamos las formas de pago al recibir tu pedido.",
          ],
        },
        { title: "Citas", text: ["Si no puedes llegar a tu cita, avísanos con la mayor anticipación posible para darle el espacio a otra persona."] },
        {
          title: "Responsabilidad",
          text: ["Hacemos nuestro mejor esfuerzo para que la información de esta página sea correcta y esté actualizada, pero puede tener errores. No respondemos por daños causados por el mal uso de esta página."],
        },
        { title: "Contacto", text: [`Para cualquier duda o reclamo, escríbenos por ${contact}.`] },
      ],
    };
  }

  const rates = (co?.rates ?? []).map((r) => (r.from ? `desde ${r.from} ${site.currency} de compra: ${r.fee ? `${r.fee} ${site.currency}` : "gratis"}` : r.fee ? `${r.fee} ${site.currency}` : "gratis"));
  return {
    title: "Envíos y devoluciones",
    sections: [
      {
        title: "Entregas",
        text: [
          co?.delivery ? `Hacemos entregas a domicilio${co.deliveryNote ? ` (${co.deliveryNote})` : ""}.` : "Por ahora no hacemos entregas a domicilio.",
          co?.delivery ? (rates.length ? `Costo de envío: ${rates.join("; ")}.` : "El costo de envío te lo confirmamos al recibir tu pedido.") : "",
          co?.pickup ? `También puedes recoger tu pedido${co.pickupNote ? `: ${co.pickupNote}` : " en nuestro local"}.` : "",
        ].filter(Boolean),
      },
      {
        title: "Cambios y devoluciones",
        text: [
          "Revisa tu pedido al recibirlo. Si llegó dañado, incompleto o no es lo que pediste, avísanos dentro de las 48 horas siguientes con una foto y lo resolvemos: lo cambiamos, completamos o te devolvemos tu dinero.",
          "Los productos perecederos (comida, flores, etc.) y los hechos a la medida no tienen cambio, salvo que lleguen en mal estado.",
          "Los reembolsos se hacen por el mismo medio de pago, en un plazo de hasta 10 días hábiles.",
        ],
      },
      { title: "Contacto", text: [`Escríbenos por ${contact}.`] },
    ],
  };
}
