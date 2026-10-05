import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La raíz del proyecto es esta carpeta (evita que Next confunda otros package-lock.json).
  turbopack: { root: __dirname },
  // pdfkit lee sus archivos de fuentes desde node_modules: se usa tal cual, sin empaquetar.
  serverExternalPackages: ["pdfkit", "svg-to-pdfkit"],
  outputFileTracingIncludes: {
    "/api/marca/*": ["./node_modules/pdfkit/js/data/**/*"],
  },
};

export default nextConfig;
