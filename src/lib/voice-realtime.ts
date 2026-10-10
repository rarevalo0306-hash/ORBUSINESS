// Conversación por voz en tiempo real con OpenAI (WebRTC), solo en el navegador.
// La IA de tiempo real es la voz de Nuna: lee lo que se le manda (speak) y avisa lo que dijo el
// dueño (onTranscript). No contesta por su cuenta: las respuestas las escribe Nuna en el servidor.

export type RealtimeEvents = {
  onSpeaking?: (speaking: boolean) => void;
  onListening?: (listening: boolean) => void; // el dueño está hablando
  onTranscript?: (text: string) => void; // lo que terminó de decir el dueño
  onClosed?: (reason: string) => void;
};

export const canRealtime = () =>
  typeof window !== "undefined" && typeof RTCPeerConnection !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

export class RealtimeVoice {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private mic: MediaStream | null = null;
  private audio: HTMLAudioElement | null = null;
  private queue: string[] = [];
  private closed = false;
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private responseId: string | null = null;
  private saying = ""; // lo que Nuna está diciendo (para no tomar su propio eco como respuesta)
  // Lo que dice el dueño llega en pedazos si hace pausas: se juntan y se manda todo junto.
  private heard: string[] = [];
  private userTalking = false;
  private segmentsPending = 0;
  private merge: ReturnType<typeof setTimeout> | null = null;
  speaking = false;

  constructor(private events: RealtimeEvents = {}) {}

  // Pide la llave temporal al servidor y conecta micrófono y altavoz con OpenAI.
  async connect() {
    const res = await fetch("/api/voz/sesion", { method: "POST" });
    const json = (await res.json().catch(() => ({}))) as { key?: string; error?: string };
    if (!res.ok || !json.key) throw new Error(json.error ?? "No se pudo iniciar la voz");

    const pc = new RTCPeerConnection();
    this.pc = pc;
    this.audio = document.createElement("audio");
    this.audio.autoplay = true;
    pc.ontrack = (e) => {
      if (this.audio) this.audio.srcObject = e.streams[0];
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) this.close(pc.connectionState);
    };

    this.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    pc.addTrack(this.mic.getTracks()[0], this.mic);

    const dc = pc.createDataChannel("oai-events");
    this.dc = dc;
    dc.onmessage = (e) => this.handle(e.data);
    const opened = new Promise<void>((resolve, reject) => {
      dc.onopen = () => resolve();
      setTimeout(() => reject(new Error("La voz tardó demasiado en conectar")), 15_000);
    });

    await pc.setLocalDescription(await pc.createOffer());
    const sdp = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: { Authorization: `Bearer ${json.key}`, "Content-Type": "application/sdp" },
      body: pc.localDescription?.sdp,
    });
    if (!sdp.ok) throw new Error(`OpenAI no aceptó la conexión (${sdp.status})`);
    await pc.setRemoteDescription({ type: "answer", sdp: await sdp.text() });
    await opened;
    this.flush();
  }

  // Nuna dice este texto tal cual, con voz natural.
  speak(text: string) {
    const clean = text.trim();
    if (!clean) return;
    this.queue.push(clean);
    this.flush();
  }

  // Calla a Nuna (por ejemplo, si el dueño la interrumpe con el botón).
  stopSpeaking() {
    this.queue = [];
    this.send(this.responseId ? { type: "response.cancel", response_id: this.responseId } : { type: "response.cancel" });
    this.send({ type: "output_audio_buffer.clear" });
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = null;
    this.speaking = false;
    this.events.onSpeaking?.(false);
  }

  close(reason = "close_requested") {
    if (this.closed) return;
    this.closed = true;
    if (this.watchdog) clearTimeout(this.watchdog);
    if (this.merge) clearTimeout(this.merge);
    this.dc?.close();
    this.pc?.close();
    this.mic?.getTracks().forEach((t) => t.stop());
    if (this.audio) this.audio.srcObject = null;
    this.events.onSpeaking?.(false);
    this.events.onListening?.(false);
    this.events.onClosed?.(reason);
  }

  private doneSpeaking() {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = null;
    if (!this.speaking) return;
    this.speaking = false;
    this.events.onSpeaking?.(this.queue.length > 0);
    this.flush();
  }

  // Manda lo que dijo el dueño cuando termina de verdad: sin hablar 1.2 s y sin pedazos por transcribir.
  private scheduleHeard() {
    if (this.merge) clearTimeout(this.merge);
    if (this.userTalking || (!this.heard.length && !this.segmentsPending)) return;
    // Si un pedazo nunca llega a transcribirse, no se queda esperando para siempre.
    const wait = this.segmentsPending > 0 ? 4000 : 1200;
    this.merge = setTimeout(() => {
      this.segmentsPending = 0;
      const text = this.heard.join(" ").replace(/\s+/g, " ").trim();
      this.heard = [];
      if (text) this.events.onTranscript?.(text);
    }, wait);
  }

  // ¿Es su propia voz que se coló por el altavoz?
  private isEcho(text: string) {
    const words = (t: string) => t.toLowerCase().normalize("NFD").replace(/[^a-z0-9ñ\s]/g, "").split(/\s+/).filter(Boolean);
    const said = new Set(words(this.saying));
    const heard = words(text);
    return heard.length > 0 && said.size > 0 && heard.filter((w) => said.has(w)).length / heard.length >= 0.8;
  }

  private send(event: Record<string, unknown>) {
    if (this.dc?.readyState === "open") this.dc.send(JSON.stringify(event));
  }

  // Un texto a la vez: el siguiente sale cuando termina de sonar el anterior.
  private flush() {
    if (this.speaking || this.dc?.readyState !== "open") return;
    const text = this.queue.shift();
    if (!text) return;
    this.speaking = true;
    this.saying = text;
    this.events.onSpeaking?.(true);
    // Seguro: si el audio no empieza en 10 s, se da por terminado y se sigue escuchando.
    this.watchdog = setTimeout(() => this.doneSpeaking(), 10_000);
    this.send({
      type: "response.create",
      response: {
        conversation: "none",
        output_modalities: ["audio"],
        instructions:
          "Lee en voz alta EXACTAMENTE el texto entre comillas angulares, palabra por palabra, sin agregar saludo, " +
          `comentario ni pregunta extra, con tu voz natural y expresiva: «${text}»`,
      },
    });
  }

  private handle(raw: string) {
    let event: { type?: string; transcript?: string; response?: { id?: string; status?: string }; error?: { message?: string } };
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }
    switch (event.type) {
      case "input_audio_buffer.speech_started":
        // El dueño habla: si Nuna estaba hablando, se calla para escucharlo.
        this.userTalking = true;
        if (this.merge) clearTimeout(this.merge);
        if (this.speaking) this.stopSpeaking();
        this.events.onListening?.(true);
        break;
      case "input_audio_buffer.speech_stopped":
        this.userTalking = false;
        this.segmentsPending++;
        this.scheduleHeard();
        this.events.onListening?.(false);
        break;
      case "conversation.item.input_audio_transcription.completed": {
        this.segmentsPending = Math.max(0, this.segmentsPending - 1);
        const text = event.transcript?.trim();
        if (text && !this.isEcho(text)) this.heard.push(text);
        this.scheduleHeard();
        break;
      }
      case "conversation.item.input_audio_transcription.failed":
        this.segmentsPending = Math.max(0, this.segmentsPending - 1);
        this.scheduleHeard();
        break;
      case "response.created":
        this.responseId = event.response?.id ?? null;
        break;
      case "output_audio_buffer.started":
        if (this.watchdog) clearTimeout(this.watchdog);
        this.watchdog = null;
        break;
      case "output_audio_buffer.stopped":
      case "output_audio_buffer.cleared":
        this.doneSpeaking();
        break;
      case "response.done": {
        // Si la respuesta falló o no trajo audio, no se queda esperando.
        const status = event.response?.status;
        if (status && status !== "completed" && this.speaking) this.doneSpeaking();
        break;
      }
      case "error":
        console.error("Voz en tiempo real:", event.error?.message);
        break;
    }
  }
}
