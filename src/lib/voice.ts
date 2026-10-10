// Voz en el navegador: reconocimiento de voz (el dueño habla y se escribe) y lectura en voz alta
// (Nuna lee sus preguntas). Usa lo que trae el navegador (Chrome, Edge, Safari, Android), sin costo
// ni llaves. Donde no existe (por ejemplo Firefox), los botones de voz simplemente no aparecen.

// Idioma para el reconocimiento según el país del negocio (español con el acento de la región).
export function voiceLang(countryCode: string | null | undefined) {
  const cc = (countryCode ?? "").toUpperCase();
  if (!cc || cc === "US" || cc === "CA") return "es-US";
  return /^[A-Z]{2}$/.test(cc) ? `es-${cc}` : "es-MX";
}

type Alternative = { transcript: string };
type Result = { isFinal: boolean; length: number; [i: number]: Alternative };
export type RecognitionEvent = { resultIndex: number; results: { length: number; [i: number]: Result } };
export type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

export function recognitionClass(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";

// La voz más natural disponible en español: primero la del país, luego latinoamericana, luego cualquiera.
export function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("es"));
  if (!voices.length) return null;
  const norm = (l: string) => l.toLowerCase().replace("_", "-");
  const order = [norm(lang), "es-us", "es-mx", "es-419", "es-co", "es-ar", "es-es"];
  // Voces buenas conocidas primero; las de juguete de Apple (Grandma, Rocko…) al final.
  const quality = (v: SpeechSynthesisVoice) =>
    /natural|premium|enhanced|neural|siri/i.test(v.name)
      ? 0
      : /paulina|m[oó]nica|google|dalia|sabina|elvira|helena|laura|jorge|juan|diego|isabela|camila|valeria/i.test(v.name)
        ? 1
        : /eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|jester|organ|superstar|trinoids|whisper|wobble|zarvox|good news/i.test(v.name)
          ? 3
          : 2;
  return [...voices].sort((a, b) => {
    const ra = order.indexOf(norm(a.lang));
    const rb = order.indexOf(norm(b.lang));
    const toyA = quality(a) === 3 ? 1 : 0;
    const toyB = quality(b) === 3 ? 1 : 0;
    return toyA - toyB || (ra < 0 ? 99 : ra) - (rb < 0 ? 99 : rb) || quality(a) - quality(b);
  })[0];
}

// Texto apto para leer: sin emojis, enlaces ni símbolos que la voz deletrea.
export function speakable(text: string) {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/[*_#>`~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Se lee por oraciones: algunos navegadores cortan los textos largos a los ~15 segundos.
export function sentences(text: string) {
  return (text.match(/[^.!?]+[.!?]*/g) ?? [text]).map((s) => s.trim()).filter(Boolean);
}
