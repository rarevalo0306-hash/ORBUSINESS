"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Muestra contenido pensado para un ancho fijo (por ejemplo 1280 px) achicado al ancho disponible.
export function Scaled({ width, height, children, className = "" }: { width: number; height: number; children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);
  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={outer} className={`relative w-full overflow-hidden ${className}`} style={{ height: height * scale }}>
      <div inert className="pointer-events-none absolute left-0 top-0 origin-top-left" style={{ width, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}
