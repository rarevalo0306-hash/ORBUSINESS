import type { Metadata } from "next";
import { LEGAL_CONTACT, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Cómo borrar tus datos" };

// Instrucciones para borrar datos (Meta las pide para "Iniciar sesión con Facebook").
export default function DataDeletionPage() {
  return (
    <LegalPage title="Cómo borrar tus datos">
      <p>
        Si entraste a Orbusiness con Facebook, Google, WhatsApp o tu correo, puedes pedir que borremos tu cuenta y todos los datos de tu
        negocio cuando quieras.
      </p>
      <h2>Pasos</h2>
      <ul>
        <li>
          Escríbenos a <a href={`mailto:${LEGAL_CONTACT}?subject=Borrar%20mis%20datos`} className="underline underline-offset-4">{LEGAL_CONTACT}</a>{" "}
          con el asunto «Borrar mis datos», desde el correo de tu cuenta (o dinos el número de WhatsApp con el que entras).
        </li>
        <li>Te confirmamos que recibimos tu solicitud y borramos tu cuenta, tu negocio, tu página web y tu CRM en un máximo de 30 días.</li>
        <li>Te avisamos cuando esté hecho. Solo conservamos lo que la ley nos obligue a guardar.</li>
      </ul>
      <h2>Quitar el permiso desde Facebook</h2>
      <p>
        También puedes quitarle el acceso a Orbusiness desde tu Facebook: Configuración y privacidad → Configuración → Apps y sitios web →
        Orbusiness → Eliminar.
      </p>
    </LegalPage>
  );
}
