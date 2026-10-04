"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { registerAsset, removeAsset } from "./actions";

type Asset = { id: string; kind: string; url: string };

const MAX_BYTES = 5 * 1024 * 1024;

export function Uploader({
  businessId,
  kind,
  label,
  emptyNote,
  multiple,
  assets,
}: {
  businessId: string;
  kind: "logo" | "photo";
  label: string;
  emptyNote: string;
  multiple: boolean;
  assets: Asset[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputId = `upload-${kind}`;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const supabase = createClient();
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError("Solo imágenes (JPG, PNG, WEBP o SVG).");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} pesa más de 5 MB.`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${businessId}/${kind}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("brand-assets")
        .upload(path, file, { contentType: file.type });
      if (uploadError) {
        setError(`No se pudo subir ${file.name}: ${uploadError.message}`);
        continue;
      }
      await registerAsset(kind, path);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
      <label htmlFor={inputId} className="font-semibold">
        {label}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple={multiple}
        disabled={pending}
        onChange={(e) => {
          const files = e.target.files;
          startTransition(() => upload(files));
          e.target.value = "";
        }}
        className="text-sm text-muted file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-panel-2 file:px-4 file:font-semibold file:text-bone"
      />
      {pending && <p className="text-sm text-muted">Subiendo…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      {assets.length === 0 ? (
        <p className="text-sm text-muted">{emptyNote}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {assets.map((a) => (
            <li key={a.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt="" className="aspect-square w-full rounded-lg bg-panel-2 object-cover" />
              <button
                type="button"
                onClick={() => startTransition(() => removeAsset(a.id))}
                aria-label="Quitar imagen"
                className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-ink/80 text-bone"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
