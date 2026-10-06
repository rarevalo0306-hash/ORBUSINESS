// Limpieza de SVG que viene de afuera (los símbolos que dibuja la IA). Solo deja figuras, colores y
// degradados: nada de scripts, enlaces, imágenes, texto, estilos ni eventos. Se aplica al guardar y
// también cada vez que se lee, porque el SVG se muestra dentro de la página pública del negocio.
// Sirve en el navegador y en el servidor (sin dependencias).

const TAGS = new Set(["g", "path", "circle", "ellipse", "rect", "polygon", "polyline", "line", "defs", "lineargradient", "radialgradient", "stop", "clippath"]);
const SELF = new Set(["path", "circle", "ellipse", "rect", "polygon", "polyline", "line", "stop"]);
const ATTRS: Record<string, string> = Object.fromEntries(
  [
    "d", "cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "points", "x1", "y1", "x2", "y2", "fx", "fy",
    "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "fill-rule", "clip-rule",
    "opacity", "fill-opacity", "stroke-opacity", "transform", "offset", "stop-color", "stop-opacity",
    "gradientUnits", "gradientTransform", "spreadMethod", "clipPathUnits", "id", "clip-path",
  ].map((a) => [a.toLowerCase(), a]),
);
const STYLE_PROPS = new Set(["fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity", "fill-rule", "stop-color", "stop-opacity"]);
const MAX_LENGTH = 150_000;

const SAFE_TRANSFORM = /^[\s\d.,eE+\-()]*(?:(?:matrix|translate|scale|rotate|skewX|skewY)\([\d\s.,eE+\-]*\)[\s,]*)*$/;
const SAFE_COLOR = /^(#[0-9a-fA-F]{3,8}|none|currentColor|rgba?\([\d\s.,%]+\)|[a-zA-Z]{3,20}|url\(#[\w-]+\))$/;

function cleanValue(name: string, value: string, prefix: string): string | null {
  const v = value.trim();
  if (/javascript:|data:|expression|@import|\\/i.test(v)) return null;
  if (name === "id") return `${prefix}${v.replace(/[^\w-]/g, "")}`;
  if (name === "transform" || name === "gradientTransform") return SAFE_TRANSFORM.test(v) ? v : null;
  if (["fill", "stroke", "stop-color", "clip-path"].includes(name)) {
    const local = v.replace(/url\(\s*['"]?#([\w-]+)['"]?\s*\)/, `url(#${prefix}$1)`);
    return SAFE_COLOR.test(local) ? local : null;
  }
  if (name === "d" || name === "points") return /^[\d\s.,eE+\-MmLlHhVvCcSsQqTtAaZz]*$/.test(v) ? v : null;
  return /^[\w\s.,%#+\-()]*$/.test(v) ? v : null;
}

function attrsOf(raw: string, prefix: string) {
  const out: [string, string][] = [];
  const re = /([a-zA-Z_:][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const name = m[1].toLowerCase();
    const value = m[3] ?? m[4] ?? "";
    if (name === "style") {
      for (const decl of value.split(";")) {
        const [k, ...rest] = decl.split(":");
        const prop = k?.trim().toLowerCase();
        if (prop && STYLE_PROPS.has(prop)) {
          const v = cleanValue(prop, rest.join(":"), prefix);
          if (v != null) out.push([prop, v]);
        }
      }
      continue;
    }
    const canonical = ATTRS[name];
    if (!canonical) continue;
    const v = cleanValue(canonical, value, prefix);
    if (v != null) out.push([canonical, v]);
  }
  return out;
}

// Devuelve solo el contenido seguro (sin la etiqueta <svg>). prefix: se agrega a los id (al guardar
// un símbolo nuevo) para que no choquen con los de otros símbolos en la misma página.
export function sanitizeSvgFragment(input: string, prefix = ""): string {
  if (typeof input !== "string" || input.length > MAX_LENGTH * 3) return "";
  const src = input.replace(/<!--[\s\S]*?-->/g, "").replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "").replace(/<\?[\s\S]*?\?>/g, "").replace(/<!DOCTYPE[^>]*>/gi, "");
  const re = /<\s*(\/)?\s*([a-zA-Z][\w:-]*)([^>]*?)(\/)?\s*>/g;
  let out = "";
  const stack: string[] = [];
  let skip = 0; // dentro de una etiqueta no permitida: se descarta todo su contenido
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const closing = Boolean(m[1]);
    const tag = m[2].toLowerCase();
    const selfClosing = Boolean(m[4]);
    if (tag === "svg") continue;
    const allowed = TAGS.has(tag);
    if (skip > 0) {
      if (!allowed && !selfClosing) skip += closing ? -1 : 1;
      continue;
    }
    if (!allowed) {
      if (!closing && !selfClosing) skip = 1;
      continue;
    }
    const name = tag === "lineargradient" ? "linearGradient" : tag === "radialgradient" ? "radialGradient" : tag === "clippath" ? "clipPath" : tag;
    if (closing) {
      if (stack[stack.length - 1] === name) {
        stack.pop();
        out += `</${name}>`;
      }
      continue;
    }
    const attrs = attrsOf(m[3], prefix)
      .map(([k, v]) => `${k}="${v.replace(/[<>"&]/g, "")}"`)
      .join(" ");
    if (selfClosing || SELF.has(name)) out += `<${name}${attrs ? ` ${attrs}` : ""}/>`;
    else {
      out += `<${name}${attrs ? ` ${attrs}` : ""}>`;
      stack.push(name);
    }
    if (out.length > MAX_LENGTH) return "";
  }
  while (stack.length) out += `</${stack.pop()}>`;
  return out;
}

// Pinta todo el símbolo de un solo color (versión en blanco o a un color).
export function recolorFragment(svg: string, color: string) {
  return `<g fill="${color}">${svg.replace(/\b(fill|stroke|stop-color)="(?!none")[^"]*"/g, `$1="${color}"`)}</g>`;
}
