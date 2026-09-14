import { openInOs } from './browserSession';

export interface DownloadReceipt {
  filename: string;
  mimeType: string;
  dataUrl: string;
}

export interface BinaryResult {
  ok: boolean;
  status: number;
  dataUrl?: string;
  mimeType?: string;
  text?: string;
}

interface AuroraNativeBridge {
  isElectron: boolean;
  netRequest?: (opts: { url: string; method?: string; body?: string; binary?: boolean }) => Promise<{
    ok: boolean;
    status: number;
    text: string;
    mimeType?: string;
    dataUrl?: string;
  }>;
  openExternal?: (url: string) => Promise<void>;
  onOpenInTab?: (cb: (url: string) => void) => () => void;
  onDownloadReceipt?: (cb: (receipt: DownloadReceipt) => void) => () => void;
  onDownloadImage?: (cb: (url: string) => void) => () => void;
}

declare global {
  interface Window {
    auroraNative?: AuroraNativeBridge;
  }
}

let nativeCache: boolean | null = null;

export function isNative(): boolean {
  if (nativeCache === null) {
    nativeCache = typeof window !== 'undefined' && window.auroraNative?.isElectron === true;
  }
  return nativeCache;
}

export async function nativeRequest(
  url: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<{ ok: boolean; status: number; text: string }> {
  const bridge = window.auroraNative;
  if (!bridge?.netRequest) return { ok: false, status: 0, text: 'Sin puente nativo' };
  try {
    return await bridge.netRequest({
      url,
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    return { ok: false, status: 0, text: e instanceof Error ? e.message : String(e) };
  }
}

export async function nativeBinaryRequest(url: string): Promise<BinaryResult> {
  const bridge = window.auroraNative;
  if (!bridge?.netRequest) return { ok: false, status: 0 };
  try {
    return await bridge.netRequest({ url, method: 'GET', binary: true });
  } catch (e) {
    return { ok: false, status: 0, text: e instanceof Error ? e.message : String(e) };
  }
}

export function onNativeDownload(cb: (receipt: DownloadReceipt) => void): () => void {
  return window.auroraNative?.onDownloadReceipt?.(cb) ?? (() => {});
}

export function onNativeDownloadImage(cb: (url: string) => void): () => void {
  return window.auroraNative?.onDownloadImage?.(cb) ?? (() => {});
}

export async function openExternalBrowser(url: string): Promise<void> {
  const bridge = window.auroraNative;
  if (bridge?.openExternal) {
    await bridge.openExternal(url).catch(() => {});
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

let bridgeBound = false;

export function initNativeBridge(): void {
  if (bridgeBound) return;
  bridgeBound = true;
  window.auroraNative?.onOpenInTab?.((url) => {
    if (/^https?:/i.test(url)) openInOs(url);
  });
}

initNativeBridge();