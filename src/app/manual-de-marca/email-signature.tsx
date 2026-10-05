"use client";

import { useRef, useState } from "react";

// Firma de email: se copia con formato y se pega en Gmail / Outlook (Configuración → Firma).
export function EmailSignature({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([ref.current?.innerText ?? ""], { type: "text/plain" }),
        }),
      ]);
    } catch {
      // Navegadores sin ClipboardItem: se selecciona la firma para copiarla con Ctrl+C / Cmd+C.
      const range = document.createRange();
      if (ref.current) range.selectNodeContents(ref.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand("copy");
    }
    setCopied(true);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* La firma viene de datos del negocio escapados en el servidor (ver page.tsx). */}
      <div ref={ref} className="rounded-xl border border-neutral-200 bg-white p-5" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="flex items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={copy}
          className="min-h-11 rounded-full bg-neutral-900 px-5 font-semibold text-white"
        >
          Copiar firma
        </button>
        <span role="status" className="text-sm text-neutral-600">
          {copied ? "Copiada. Pégala en la configuración de firma de tu email." : ""}
        </span>
      </div>
    </div>
  );
}
