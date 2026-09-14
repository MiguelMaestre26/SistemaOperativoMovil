export interface VoiceHandlers {
  lang?: string;
  onResult: (text: string) => void;
  onInterim?: (text: string) => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
}

interface SpeechRecognitionEventLike {
  results?: ArrayLike<{ isFinal: boolean; [i: number]: { transcript?: string } }>;
}

function getCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isSpeechSupported(): boolean {
  return getCtor() !== null;
}

function readableError(code: string): string {
  const map: Record<string, string> = {
    'not-allowed': 'Permiso del micrófono denegado. Concede el acceso en el navegador e inténtalo de nuevo.',
    'service-not-allowed': 'El servicio de reconocimiento de voz está bloqueado en este navegador.',
    'audio-capture': 'No se detectó ningún micrófono en el dispositivo.',
    network: 'Sin conexión a internet: la voz necesita el servicio de reconocimiento.',
    'no-speech': 'No te escuché nada. Habla cerca del micrófono e inténtalo de nuevo.',
    'language-not-supported': 'El idioma elegido (es-ES) no está soportado en este navegador.',
    aborted: 'Dictado detenido.',
  };
  return map[code] ?? `Error de voz (${code}).`;
}

export function startVoiceRecognition(handlers: VoiceHandlers): () => void {
  const Ctor = getCtor();
  if (!Ctor) {
    handlers.onError?.(
      new Error('La voz no está disponible en este entorno. Usa Chrome, Edge o tu iPhone con Siri activado y sitio en HTTPS.')
    );
    handlers.onEnd?.();
    return () => {};
  }

  const rec = new Ctor();
  rec.lang = handlers.lang ?? 'es-ES';
  rec.continuous = false;
  rec.interimResults = true;

  let sent = false;

  rec.onresult = (e) => {
    const list = e?.results;
    if (!list || list.length === 0) return;
    for (let i = 0; i < list.length; i++) {
      const seg = list[i];
      const text = seg?.[0]?.transcript?.trim();
      if (!text) continue;
      if (seg.isFinal) {
        if (!sent) {
          sent = true;
          handlers.onResult(text);
        }
        return;
      }
      if (!sent) handlers.onInterim?.(text);
    }
  };

  rec.onerror = (e) => {
    if (e?.error && e.error !== 'aborted' && !sent) {
      handlers.onError?.(new Error(readableError(e.error)));
    }
    handlers.onEnd?.();
  };

  rec.onend = () => handlers.onEnd?.();

  try {
    rec.start();
  } catch {
    handlers.onError?.(new Error('No se pudo iniciar el micrófono.'));
    handlers.onEnd?.();
  }

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    try {
      rec.abort();
      rec.stop();
    } catch {
      /* ya detenida */
    }
    handlers.onEnd?.();
  };
}