"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Fish } from "@/components/fish";
import { Button } from "@/components/ui";
import { canSpeak, pickVoice, recognitionClass, sentences, speakable, type Recognition } from "@/lib/voice";
import { answerInterview } from "./actions";

type Message = { id: string; role: string; content: string };

const VOICE_KEY = "orbusiness:voz-entrevista";

function MicIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
    </svg>
  );
}

function SpeakerIcon({ className = "size-5", on }: { className?: string; on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4z" />
      {on ? <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /> : <path d="m22 9-6 6M16 9l6 6" />}
    </svg>
  );
}

export function InterviewChat({ messages, open, lang = "es-MX" }: { messages: Message[]; open: boolean; lang?: string }) {
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  // Voz: qué soporta este navegador (se revisa ya en el navegador para no romper el primer render).
  const [support, setSupport] = useState({ listen: false, speak: false });
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const voiceModeRef = useRef(false);
  const lastNuna = messages.filter((m) => m.role !== "owner").at(-1)?.id ?? null;
  const spokenRef = useRef<string | null>(lastNuna); // lo que ya estaba al abrir no se vuelve a leer

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, pending]);

  const send = useCallback(
    (text: string) => {
      if (!text.trim() || pending) return;
      setDraft("");
      startTransition(() => answerInterview(text));
    },
    [pending],
  );

  const stopListening = useCallback(() => {
    recRef.current?.abort();
    recRef.current = null;
    setListening(false);
  }, []);

  // Escucha al dueño. En modo voz, al terminar de hablar la respuesta se envía sola;
  // con el micrófono suelto, el texto queda en la caja para revisarlo y enviarlo.
  const listen = useCallback(
    (autoSend: boolean) => {
      const Rec = recognitionClass();
      if (!Rec || recRef.current) return;
      window.speechSynthesis?.cancel();
      const rec = new Rec();
      rec.lang = lang;
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      const base = autoSend ? "" : draft.trim();
      let heard = "";
      rec.onresult = (e) => {
        let text = "";
        for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
        heard = text.trim();
        setDraft([base, heard].filter(Boolean).join(" "));
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setHint("Para hablar, permite el uso del micrófono en tu navegador (el ícono junto a la dirección de la página).");
          voiceModeRef.current = false;
          setVoiceMode(false);
        } else if (e.error === "no-speech") {
          setHint("No te escuché. Toca el micrófono y habla cuando se ponga rojo.");
        } else if (e.error !== "aborted") {
          setHint("No pude usar el micrófono. Puedes escribir tu respuesta.");
        }
      };
      rec.onend = () => {
        recRef.current = null;
        setListening(false);
        if (autoSend && heard) send(heard);
      };
      try {
        rec.start();
        recRef.current = rec;
        setListening(true);
        setHint(null);
      } catch {
        // En iPhone el micrófono a veces solo arranca con un toque del dueño.
        setHint("Toca el micrófono para responder.");
      }
    },
    [draft, lang, send],
  );

  // Nuna lee en voz alta; al terminar, en modo voz, se pone a escuchar.
  const speak = useCallback(
    (text: string, then?: () => void) => {
      if (!canSpeak()) return then?.();
      const synth = window.speechSynthesis;
      synth.cancel();
      const parts = sentences(speakable(text));
      if (!parts.length) return then?.();
      const voice = pickVoice(lang);
      setSpeaking(true);
      parts.forEach((part, i) => {
        const u = new SpeechSynthesisUtterance(part);
        u.lang = voice?.lang ?? lang;
        if (voice) u.voice = voice;
        u.rate = 1.03;
        if (i === parts.length - 1) {
          u.onend = () => {
            setSpeaking(false);
            then?.();
          };
          u.onerror = () => setSpeaking(false);
        }
        synth.speak(u);
      });
    },
    [lang],
  );

  useEffect(() => {
    const listenOk = Boolean(recognitionClass());
    const speakOk = canSpeak();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- depende del navegador, solo se sabe ya montado
    setSupport({ listen: listenOk, speak: speakOk });
    if (speakOk) window.speechSynthesis.getVoices(); // algunos navegadores cargan las voces tarde
    let saved = false;
    try {
      saved = localStorage.getItem(VOICE_KEY) === "1";
    } catch {}
    if (saved && listenOk && speakOk) {
      voiceModeRef.current = true;
      setVoiceMode(true);
    }
    return () => {
      recRef.current?.abort();
      if (speakOk) window.speechSynthesis.cancel();
    };
  }, []);

  // Llegó un mensaje nuevo de Nuna: en modo voz lo lee y después escucha la respuesta.
  useEffect(() => {
    if (!lastNuna || lastNuna === spokenRef.current) return;
    const from = messages.findIndex((m) => m.id === spokenRef.current);
    spokenRef.current = lastNuna;
    if (!voiceModeRef.current) return;
    const fresh = messages.slice(from + 1).filter((m) => m.role !== "owner");
    speak(fresh.map((m) => m.content).join(" "), () => {
      if (voiceModeRef.current && open) listen(true);
    });
  }, [lastNuna, messages, open, speak, listen]);

  function toggleVoiceMode() {
    const next = !voiceMode;
    voiceModeRef.current = next;
    setVoiceMode(next);
    setHint(null);
    try {
      localStorage.setItem(VOICE_KEY, next ? "1" : "0");
    } catch {}
    if (!next) {
      stopListening();
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    // Se activa con un toque: es el momento en que el navegador deja hablar y usar el micrófono.
    const last = messages.filter((m) => m.role !== "owner").at(-1);
    if (last) speak(last.content, () => voiceModeRef.current && open && listen(true));
    else if (open) listen(true);
  }

  const voiceReady = support.listen && support.speak;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={listRef}
        aria-live="polite"
        className="flex h-[26rem] flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-panel p-4"
      >
        {messages.map((m) =>
          m.role === "owner" ? (
            <p key={m.id} className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-panel-2 px-4 py-2.5">
              {m.content}
            </p>
          ) : (
            <div key={m.id} className="flex max-w-[90%] gap-3">
              <Fish size={26} className="mt-0.5 shrink-0 text-lime" />
              <p className="leading-relaxed">{m.content}</p>
            </div>
          ),
        )}
        {pending && (
          <div className="flex gap-3 text-muted">
            <Fish size={26} className="shrink-0 text-lime" />
            <span>Nuna está escribiendo…</span>
          </div>
        )}
      </div>

      {open && voiceReady && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleVoiceMode}
            aria-pressed={voiceMode}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
              voiceMode ? "border-lime bg-lime text-lime-ink" : "border-line text-bone hover:bg-panel"
            }`}
          >
            <SpeakerIcon on={voiceMode} />
            {voiceMode ? "Conversando por voz" : "Conversar por voz"}
          </button>
          <span className="text-sm text-muted" role="status">
            {speaking
              ? "Nuna está hablando…"
              : listening
                ? "Te escucho… habla con calma."
                : voiceMode
                  ? "Nuna te lee cada pregunta y escucha tu respuesta."
                  : "Nuna te lee las preguntas y tú contestas hablando."}
          </span>
          {speaking && (
            <button
              type="button"
              onClick={() => {
                window.speechSynthesis.cancel();
                setSpeaking(false);
              }}
              className="min-h-9 rounded-full border border-line px-3 text-xs text-muted hover:text-bone"
            >
              Callar
            </button>
          )}
        </div>
      )}

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            stopListening();
            send(draft);
          }}
          className="flex gap-2"
        >
          {support.listen && (
            <button
              type="button"
              onClick={() => (listening ? recRef.current?.stop() : listen(voiceMode))}
              aria-pressed={listening}
              aria-label={listening ? "Dejar de escuchar" : "Responder hablando"}
              className={`flex size-12 shrink-0 items-center justify-center rounded-full border transition ${
                listening ? "animate-pulse border-red-500 bg-red-500 text-white" : "border-line text-bone hover:bg-panel"
              }`}
            >
              <MicIcon />
            </button>
          )}
          <label htmlFor="answer" className="sr-only">
            Tu respuesta
          </label>
          <input
            id="answer"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
            placeholder={listening ? "Te escucho…" : support.listen ? "Escribe o toca el micrófono…" : "Escribe tu respuesta…"}
            className="min-h-12 min-w-0 flex-1 rounded-full border border-line bg-panel px-5 placeholder:text-muted/70"
          />
          <Button type="submit" disabled={pending || !draft.trim()}>
            Enviar
          </Button>
        </form>
      )}
      {hint && (
        <p role="alert" className="text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
