"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-11 rounded-full bg-neutral-900 px-5 font-semibold text-white"
    >
      Guardar como PDF / Imprimir
    </button>
  );
}
