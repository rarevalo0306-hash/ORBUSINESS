import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La raíz del proyecto es esta carpeta (evita que Next confunda otros package-lock.json).
  turbopack: { root: __dirname },
};

export default nextConfig;
