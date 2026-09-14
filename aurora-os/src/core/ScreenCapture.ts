import { toCanvas } from 'html-to-image';
import { useMediaStore } from '../stores/useMediaStore';
import { notificationService } from './NotificationService';
import { toast } from '../components/ui/Toast';

export interface RecordingResult {
  url: string;
  thumbnail: string;
}

export function saveRecordingToGallery(result: RecordingResult): void {
  const label = new Date().toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  useMediaStore.getState().addPhoto(result.url, `Grabación ${label}`, 'video', result.thumbnail);
  toast('Grabación guardada en Fotos');
  notificationService.push('gallery', 'Grabación de pantalla', 'Disponible en la app Fotos.');
}

const FRAME_INTERVAL = 140;
const MAX_RECORD_MS = 30000;
const SCREEN_SELECTOR = '[data-screen]';

function getScreenNode(): HTMLElement | null {
  return document.querySelector<HTMLElement>(SCREEN_SELECTOR);
}

function snapshotFilter(node: HTMLElement): boolean {
  if (!(node instanceof HTMLElement)) return true;
  return node.dataset.recIndicator === undefined;
}

async function captureCanvas(
  node: HTMLElement,
  width: number,
  height: number,
  pixelRatio: number
): Promise<HTMLCanvasElement> {
  return toCanvas(node, {
    width,
    height,
    pixelRatio,
    backgroundColor: undefined,
    cacheBust: true,
    filter: snapshotFilter,
  });
}

function roundScreenCorners(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return canvas;
  const radius = Math.max(1, Math.round(46 * (w / 382)));
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx || typeof ctx.roundRect !== 'function') return canvas;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, radius);
  ctx.clip();
  ctx.drawImage(canvas, 0, 0);
  return out;
}

class ScreenCaptureService {
  private recordCanvas: HTMLCanvasElement | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private frameTimer: number | null = null;
  private mimeType = 'video/webm';
  private startedAt = 0;
  private listeners = new Set<(recording: boolean) => void>();

  isRecording(): boolean {
    return this.recorder !== null && this.recorder.state === 'recording';
  }

  subscribe(cb: (recording: boolean) => void): () => void {
    this.listeners.add(cb);
    cb(this.isRecording());
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(state: boolean): void {
    this.listeners.forEach(cb => cb(state));
  }

  async takeScreenshot(): Promise<string> {
    const node = getScreenNode();
    if (!node) throw new Error('No se encontró la pantalla');
    const w = Math.round(node.clientWidth);
    const h = Math.round(node.clientHeight);
    const canvas = await captureCanvas(node, w, h, 2);
    return roundScreenCorners(canvas).toDataURL('image/jpeg', 0.9);
  }

  async startRecording(): Promise<void> {
    if (this.isRecording()) return;
    const node = getScreenNode();
    if (!node) return;
    const w = Math.round(node.clientWidth);
    const h = Math.round(node.clientHeight);

    this.mimeType = 'video/webm;codecs=vp9';
    if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(this.mimeType)) {
      this.mimeType = 'video/webm';
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const stream = canvas.captureStream(8);

    if (typeof MediaRecorder === 'undefined') throw new Error('Grabación no soportada');
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported(this.mimeType) ? this.mimeType : undefined,
      videoBitsPerSecond: 1500000,
    });
    this.recordCanvas = canvas;
    this.recorder = recorder;
    this.chunks = [];
    this.startedAt = Date.now();

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    };

    recorder.start(1000);
    this.notify(true);

    this.frameTimer = window.setInterval(() => {
      void this.captureFrame();
    }, FRAME_INTERVAL);
  }

  private async captureFrame(): Promise<void> {
    const node = getScreenNode();
    const canvas = this.recordCanvas;
    if (!node || !canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    if (this.startedAt && Date.now() - this.startedAt >= MAX_RECORD_MS) {
      this.autoStop();
      return;
    }
    try {
      const frame = await captureCanvas(node, w, h, 1);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rounded = roundScreenCorners(frame);
      ctx.drawImage(rounded, 0, 0, w, h);
    } catch (e) {
      console.warn('Fallo al capturar frame', e);
    }
  }

  stopRecording(): Promise<RecordingResult | null> {
    const recorder = this.recorder;
    const canvas = this.recordCanvas;
    if (!recorder || recorder.state === 'inactive') {
      this.cleanup();
      return Promise.resolve(null);
    }
    if (this.frameTimer !== null) {
      clearInterval(this.frameTimer);
      this.frameTimer = null;
    }

    const thumbnail = canvas?.toDataURL('image/jpeg', 0.7) ?? '';

    return new Promise<RecordingResult | null>(resolve => {
      recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: recorder.mimeType || this.mimeType });
        this.cleanup();
        if (blob.size === 0) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ url: reader.result as string, thumbnail });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      };
      recorder.stop();
    });
  }

  private async autoStop(): Promise<void> {
    const result = await this.stopRecording();
    if (result) saveRecordingToGallery(result);
    else this.cleanup();
  }

  private cleanup(): void {
    this.recorder = null;
    this.recordCanvas = null;
    this.chunks = [];
    this.frameTimer = null;
    this.startedAt = 0;
    this.notify(false);
  }
}

export const screenCaptureService = new ScreenCaptureService();