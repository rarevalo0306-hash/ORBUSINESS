"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Fish } from "@/components/fish";
import { Button } from "@/components/ui";
import { canSpeak, pickVoice, recognitionClass, sentences, speakable, type Recognition } from "@/lib/voice";
import { canRecord, startRecording, type RecorderHandle } from "@/lib/voice-recorder";
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

// Voz de la entrevista. Con la IA de voz (aiVoice), Nuna habla con voz natural de OpenAI y lo que
// dice el dueño se graba y se transcribe con IA. Sin ella, se usa la voz y el reconocimiento del navegador.
export function InterviewChat({
  messages,
  open,
  lang = "es-MX",
  aiVoice = false,
}: {
  messages: Message[];
  open: boolean;
  lang?: string;
  aiVoice?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  const [support, setSupport] = useState({ listen: false, speak: false });
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [level, setLevel] = useState(0);
  const [hint, setHint] = useState<string | null>(null);

  const voiceModeRef = useRef(false);
  const recRef = useRef<Recognition | null>(null); // reconocimiento del navegador
  const recorderRef = useRef<RecorderHandle | null>(null); // grabadora (IA)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const queueRef = useRef<Message[]>([]);
  const afterSpeakRef = useRef<(() => void) | null>(null);
  const useAi = useRef(aiVoice);

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

  // Audio y micrófono se "despiertan" con un toque del dueño (requisito de los navegadores, sobre todo iPhone).
  function unlockAudio() {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }
    if (!audioCtxRef.current && typeof AudioContext !== "undefined") {
      try {
        audioCtxRef.current = new AudioContext();
      } catch {}
    }
    audioCtxRef.current?.resume().catch(() => {});
  }

  const stopAll = useCallback(() => {
    recRef.current?.abort();
    recRef.current = null;
    recorderRef.current?.cancel();
    recorderRef.current = null;
    queueRef.current = [];
    afterSpeakRef.current = null;
    audioRef.current?.pause();
    if (canSpeak()) window.speechSynthesis.cancel();
    setListening(false);
    setSpeaking(false);
    setLevel(0);
  }, []);

  // ---------- Escuchar ----------

  const listenBrowser = useCallback(
    (autoSend: boolean) => {
      const Rec = recognitionClass();
      if (!Rec || recRef.current) return;
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
        } else if (e.error === "no-speech") setHint("No te escuché. Toca el micrófono y habla cuando se ponga rojo.");
        else if (e.error !== "aborted") setHint("No pude usar el micrófono. Puedes escribir tu respuesta.");
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
        setHint("Toca el micrófono para responder.");
      }
    },
    [draft, lang, send],
  );

  const listenAi = useCallback(
    async (autoSend: boolean) => {
      if (recorderRef.current) return;
      let handle: RecorderHandle;
      try {
        handle = await startRecording({
          audioContext: audioCtxRef.current,
          silenceMs: autoSend ? 1500 : 2500,
          onLevel: setLevel,
        });
      } catch {
        setHint("Para hablar, permite el uso del micrófono en tu navegador (el ícono junto a la dirección de la página).");
        voiceModeRef.current = false;
        setVoiceMode(false);
        return;
      }
      recorderRef.current = handle;
      setListening(true);
      setHint(audioCtxRef.current?.state === "running" ? null : "Toca el micrófono cuando termines de hablar.");
      const rec = await handle.done;
      recorderRef.current = null;
      setListening(false);
      setLevel(0);
      if (!rec) return;
      if (!rec.spoke) {
        setHint("No te escuché. Toca el micrófono y habla cuando se ponga rojo.");
        return;
      }
      setTranscribing(true);
      try {
        const body = new FormData();
        body.append("audio", rec.blob);
        const res = await fetch("/api/voz/escuchar", { method: "POST", body });
        const json = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
        const text = json.text?.trim() ?? "";
        if (!res.ok) setHint(json.error ?? "No pude entender el audio. Intenta de nuevo o escribe tu respuesta.");
        else if (!text) setHint("No te entendí bien. Intenta de nuevo, un poco más cerca del teléfono.");
        else if (autoSend) send(text);
        else setDraft((d) => [d.trim(), text].filter(Boolean).join(" "));
      } catch {
        setHint("Se cortó la conexión. Intenta de nuevo o escribe tu respuesta.");
      } finally {
        setTranscribing(false);
      }
    },
    [send],
  );

  const listen = useCallback(
    (autoSend: boolean) => {
      if (canSpeak()) window.speechSynthesis.cancel();
      audioRef.current?.pause();
      setSpeaking(false);
      if (useAi.current && canRecord()) void listenAi(autoSend);
      else listenBrowser(autoSend);
    },
    [listenAi, listenBrowser],
  );

  // ---------- Hablar ----------

  const speakBrowser = useCallback(
    (text: string, then: () => void) => {
      if (!canSpeak()) return then();
      const synth = window.speechSynthesis;
      synth.cancel();
      const parts = sentences(speakable(text));
      if (!parts.length) return then();
      const voice = pickVoice(lang);
      setSpeaking(true);
      // Seguro: si la voz del navegador se traba (pasa en Chrome), se sigue igual al tiempo estimado.
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(watchdog);
        setSpeaking(false);
        then();
      };
      const watchdog = setTimeout(() => {
        synth.cancel();
        finish();
      }, 4000 + parts.join(" ").length * 90);
      parts.forEach((part, i) => {
        const u = new SpeechSynthesisUtterance(part);
        u.lang = voice?.lang ?? lang;
        if (voice) u.voice = voice;
        u.rate = 1.03;
        if (i === parts.length - 1) {
          u.onend = finish;
          u.onerror = finish;
        }
        synth.speak(u);
      });
    },
    [lang],
  );

  // Con IA: cada mensaje de Nuna se pide como audio (/api/voz/hablar) y se reproduce en orden.
  const playNextRef = useRef<() => void>(() => {});
  useEffect(() => {
    const playNext = () => {
      const audio = audioRef.current;
      const next = queueRef.current.shift();
      if (!next) {
        setSpeaking(false);
        const then = afterSpeakRef.current;
        afterSpeakRef.current = null;
        then?.();
        return;
      }
      if (!audio) return speakBrowser(next.content, playNext);
      setSpeaking(true);
      // Si falla la voz con IA, se usa la del navegador (una sola vez, aunque fallen las dos señales).
      let fellBack = false;
      const fallback = () => {
        if (fellBack) return;
        fellBack = true;
        audio.onended = null;
        audio.onerror = null;
        speakBrowser(next.content, playNext);
      };
      audio.onended = () => playNext();
      audio.onerror = fallback;
      audio.src = `/api/voz/hablar?m=${encodeURIComponent(next.id)}`;
      audio.play().catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) fallback();
      });
    };
    playNextRef.current = playNext;
  }, [speakBrowser]);

  const speak = useCallback(
    (list: Message[], then: () => void) => {
      if (!list.length) return then();
      if (useAi.current) {
        audioRef.current?.pause();
        queueRef.current = [...list];
        afterSpeakRef.current = then;
        playNextRef.current();
      } else {
        speakBrowser(list.map((m) => m.content).join(" "), then);
      }
    },
    [speakBrowser],
  );

  // ---------- Montaje y mensajes nuevos ----------

  useEffect(() => {
    const listenOk = aiVoice ? canRecord() || Boolean(recognitionClass()) : Boolean(recognitionClass());
    const speakOk = aiVoice || canSpeak();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- depende del navegador, solo se sabe ya montado
    setSupport({ listen: listenOk, speak: speakOk });
    if (canSpeak()) window.speechSynthesis.getVoices(); // algunos navegadores cargan las voces tarde
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
      recorderRef.current?.cancel();
      audioRef.current?.pause();
      if (canSpeak()) window.speechSynthesis.cancel();
      void audioCtxRef.current?.close().catch(() => {});
    };
  }, [aiVoice]);

  // Llegó un mensaje nuevo de Nuna: en modo voz lo lee y después escucha la respuesta.
  useEffect(() => {
    if (!lastNuna || lastNuna === spokenRef.current) return;
    const from = messages.findIndex((m) => m.id === spokenRef.current);
    spokenRef.current = lastNuna;
    if (!voiceModeRef.current) return;
    const fresh = messages.slice(from + 1).filter((m) => m.role !== "owner");
    speak(fresh, () => {
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
    if (!next) return stopAll();
    unlockAudio();
    const last = messages.filter((m) => m.role !== "owner").at(-1);
    const then = () => {
      if (voiceModeRef.current && open) listen(true);
    };
    if (last) speak([last], then);
    else then();
  }

  function onMic() {
    if (listening) {
      recorderRef.current?.stop();
      recRef.current?.stop();
      return;
    }
    unlockAudio();
    setHint(null);
    listen(voiceMode);
  }

  const voiceReady = support.listen && support.speak;
  const status = speaking
    ? "Nuna está hablando…"
    : listening
      ? "Te escucho… cuando termines, haz una pausa."
      : transcribing
        ? "Nuna está entendiendo lo que dijiste…"
        : voiceMode
          ? "Nuna te lee cada pregunta y escucha tu respuesta."
          : "Nuna te lee las preguntas y tú contestas hablando.";

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
            {status}
          </span>
          {speaking && (
            <button
              type="button"
              onClick={() => {
                queueRef.current = [];
                afterSpeakRef.current = null;
                audioRef.current?.pause();
                if (canSpeak()) window.speechSynthesis.cancel();
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
            recRef.current?.abort();
            recorderRef.current?.cancel();
            send(draft);
          }}
          className="flex gap-2"
        >
          {support.listen && (
            <button
              type="button"
              onClick={onMic}
              disabled={transcribing}
              aria-pressed={listening}
              aria-label={listening ? "Terminé de hablar" : "Responder hablando"}
              className={`relative flex size-12 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-60 ${
                listening ? "border-red-500 bg-red-500 text-white" : "border-line text-bone hover:bg-panel"
              }`}
              style={listening ? { boxShadow: `0 0 0 ${3 + level * 10}px rgb(239 68 68 / 0.25)` } : undefined}
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
            placeholder={
              listening ? "Te escucho…" : transcribing ? "Escribiendo lo que dijiste…" : support.listen ? "Escribe o toca el micrófono…" : "Escribe tu respuesta…"
            }
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
