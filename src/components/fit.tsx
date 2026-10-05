"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Achica su contenido (sin cortarlo ni partirlo en líneas) para que quepa a lo ancho.
export function Fit({ children, className = "", align = "center" }: { children: ReactNode; className?: string; align?: "center" | "start" }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ scale: 1, height: 0 });

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const update = () => {
      const scale = Math.min(1, o.clientWidth / Math.max(i.offsetWidth, 1));
      setBox({ scale, height: i.offsetHeight * scale });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(o);
    ro.observe(i);
    document.fonts?.ready.then(update);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outer}
      className={`flex w-full min-w-0 items-start overflow-hidden ${align === "center" ? "justify-center" : "justify-start"} ${className}`}
      style={box.height ? { height: box.height } : undefined}
    >
      <div
        ref={inner}
        className="shrink-0"
        style={{ width: "max-content", transform: `scale(${box.scale})`, transformOrigin: align === "center" ? "top center" : "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
