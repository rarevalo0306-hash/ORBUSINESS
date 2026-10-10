// Grabadora para la voz con IA: graba al dueño y se detiene sola cuando deja de hablar
// (mide el volumen; tras ~1.5 s de silencio después de hablar, corta). Solo navegador.

export type Recording = { blob: Blob; spoke: boolean };

export const canRecord = () =>
  typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

function mimeType() {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return options.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
}

export type RecorderHandle = { stop: () => void; cancel: () => void; done: Promise<Recording | null> };

export async function startRecording(opts: {
  audioContext: AudioContext | null; // creado con un toque del dueño (así el navegador lo deja medir el volumen)
  silenceMs?: number; // silencio para cortar después de hablar
  noSpeechMs?: number; // si no habla nada en este tiempo, corta
  maxMs?: number;
  onLevel?: (level: number) => void;
}): Promise<RecorderHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  const type = mimeType();
  const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const { silenceMs = 1500, noSpeechMs = 9000, maxMs = 60_000 } = opts;
  const ctx = opts.audioContext;
  let analyser: AnalyserNode | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  if (ctx) {
    await ctx.resume().catch(() => {});
    if (ctx.state === "running") {
      source = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
    }
  }

  let spoke = false;
  let cancelled = false;
  let raf = 0;
  const started = performance.now();
  let lastVoice = started;
  let floor = 0.01;
  const buf = new Float32Array(1024);

  const done = new Promise<Recording | null>((resolve) => {
    recorder.onstop = () => {
      cancelAnimationFrame(raf);
      source?.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      if (cancelled) return resolve(null);
      resolve({ blob: new Blob(chunks, { type: recorder.mimeType || type || "audio/webm" }), spoke: spoke || !analyser });
    };
  });

  const stop = () => recorder.state !== "inactive" && recorder.stop();

  const tick = () => {
    const now = performance.now();
    if (analyser) {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const x of buf) sum += x * x;
      const rms = Math.sqrt(sum / buf.length);
      if (now - started < 400) floor = Math.max(floor, rms); // ruido del lugar
      const threshold = Math.max(0.018, floor * 2.2);
      if (rms > threshold) {
        spoke = true;
        lastVoice = now;
      }
      opts.onLevel?.(Math.min(1, rms / (threshold * 3)));
      if (spoke && now - lastVoice > silenceMs) return stop();
      if (!spoke && now - started > noSpeechMs) return stop();
    }
    if (now - started > maxMs) return stop();
    raf = requestAnimationFrame(tick);
  };

  recorder.start(250);
  raf = requestAnimationFrame(tick);
  return {
    stop,
    cancel: () => {
      cancelled = true;
      stop();
    },
    done,
  };
}
