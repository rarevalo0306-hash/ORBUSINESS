// Genera src/lib/brand-icons.ts con los íconos de Lucide (licencia ISC) que usan los isotipos.
// Uso: node scripts/build-brand-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";

const ICONS = [
  "hammer", "wrench", "paint-roller", "drill", "hard-hat", "ruler", "construction", "bolt",
  "store", "shopping-basket", "shopping-bag", "package", "gift",
  "pill", "heart-pulse", "stethoscope", "cross",
  "croissant", "cake-slice", "wheat", "cookie",
  "utensils", "chef-hat", "pizza", "soup", "sandwich", "beef", "fish", "coffee", "ice-cream-cone",
  "scissors", "sparkles", "brush", "flower-2", "palette",
  "shirt", "gem", "footprints", "ribbon",
  "car", "cog", "bike",
  "leaf", "sprout", "tree-pine", "shovel",
  "spray-can", "droplets", "shower-head", "washing-machine",
  "zap", "plug", "lightbulb",
  "paw-print", "dog", "cat",
  "book-open", "pencil", "scroll-text",
  "truck", "house", "star", "heart", "flame", "mountain", "anchor", "shield-check", "key-round", "camera", "music", "smartphone", "laptop", "apple", "milk", "candy",
];

const out = {};
for (const name of ICONS) {
  const svg = readFileSync(`node_modules/lucide-static/icons/${name}.svg`, "utf8");
  const inner = svg.slice(svg.indexOf(">", svg.indexOf("<svg")) + 1, svg.lastIndexOf("</svg>"));
  out[name] = inner.replace(/\s+/g, " ").replace(/> </g, "><").trim();
}
const body = Object.entries(out)
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join("\n");
writeFileSync(
  "src/lib/brand-icons.ts",
  `// Generado por scripts/build-brand-icons.mjs. Íconos de Lucide (https://lucide.dev), licencia ISC.\n` +
    `// Cada valor es el contenido de un <svg viewBox="0 0 24 24"> dibujado con trazo (stroke).\n\n` +
    `export const BRAND_ICONS: Record<string, string> = {\n${body}\n};\n`,
);
console.log(`brand-icons.ts: ${Object.keys(out).length} íconos`);
