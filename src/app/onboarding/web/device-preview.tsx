"use client";

import { useLayoutEffect, useRef, useState } from "react";

const DEVICES = [
  { id: "celular", label: "Celular", width: 390, height: 780 },
  { id: "tablet", label: "Tablet", width: 820, height: 1000 },
  { id: "compu", label: "Computadora", width: 1280, height: 800 },
] as const;

// Vista previa real (iframe del tamaño del aparato) para ver cómo se adapta la página.
export function DevicePreview({ src }: { src: string }) {
  const [device, setDevice] = useState<(typeof DEVICES)[number]>(DEVICES[0]);
  const box = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(800);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setAvail(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const border = device.id === "celular" ? 10 : device.id === "tablet" ? 12 : 8;
  const W = device.width + 2 * border;
  const H = device.height + 2 * border;
  const scale = Math.min(1, (avail - 24) / W);
  const radius = device.id === "celular" ? 44 : device.id === "tablet" ? 28 : 12;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Aparato" className="flex flex-wrap gap-2">
        {DEVICES.map((d) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={device.id === d.id}
            onClick={() => setDevice(d)}
            className={`inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-semibold ${device.id === d.id ? "border-lime bg-lime text-lime-ink" : "border-line hover:bg-panel"}`}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div ref={box} className="flex justify-center rounded-3xl bg-panel-2 p-3 sm:p-6">
        <div style={{ width: W * scale, height: H * scale }}>
          <div className="overflow-hidden bg-black shadow-2xl" style={{ width: W, height: H, border: `${border}px solid #0d0d0d`, borderRadius: radius, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <iframe key={src + device.id} src={src} title={`Vista previa en ${device.label.toLowerCase()}`} className="h-full w-full bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
