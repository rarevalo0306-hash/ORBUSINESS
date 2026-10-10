import { PageTitle } from "@/components/ui";
import { requireBusiness } from "@/lib/business";
import { CompareBrains } from "./compare";

// Página interna para comparar qué IA hace mejores propuestas de marca con la misma entrevista.
export const maxDuration = 300;

export default async function ComparePage() {
  const { business } = await requireBusiness();
  return (
    <>
      <PageTitle
        title="Prueba de cerebros"
        lead="La misma entrevista de tu negocio pasa por cada IA y cada una hace sus 3 propuestas de marca. Los símbolos los dibuja la misma IA de dibujo para todas, así solo se compara el cerebro. Salen a ciegas (A, B, C); al final puedes ver cuál es cuál. No cambia nada de tu marca."
      />
      <CompareBrains name={business.name} />
    </>
  );
}
